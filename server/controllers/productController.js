import pool from "../config/db.js";
import fs from "fs";
import path from "path";

// =====================================================
// IMAGE URL HELPER
// =====================================================

const getImageUrl = (filename) => {
  if (!filename) {
    return null;
  }

  const value = String(filename).trim();

  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return value;
  }

  if (value.startsWith("uploads/")) {
    return `/${value}`;
  }

  return `/uploads/${value}`;
};


// =====================================================
// NORMALIZE PRODUCT TYPE
// =====================================================

const normalizeProductType = (value) => {
  if (!value) {
    return null;
  }

  const productType = String(value).trim();

  const productTypeMap = {
    "Optical Frames": "Frame",
    "Optical Frame": "Frame",

    "Prescription Lenses": "Lens",
    "Prescription Lens": "Lens",

    "Contact Lenses": "Contact Lens",
    "Contact Lens": "Contact Lens",

    Sunglasses: "Sunglasses",

    Frame: "Frame",
    Lens: "Lens",

    Accessory: "Accessory",
    Accessories: "Accessory",

    "Lens Care": "Accessory",

    Other: "Other",
  };

  return (
    productTypeMap[productType] ||
    productType
  );
};


// =====================================================
// PARSE IMAGES
// =====================================================

const parseImages = (images) => {
  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images;
  }

  if (typeof images === "string") {
    const trimmed = images.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (typeof parsed === "string") {
        return [parsed];
      }

      return [];
    } catch {
      return [trimmed];
    }
  }

  return [];
};


// =====================================================
// NORMALIZE IMAGE LIST
// =====================================================

const normalizeImageList = (images) => {
  const parsedImages = parseImages(images);

  const finalImages = [];

  for (const image of parsedImages) {
    let imageURL = "";

    if (typeof image === "string") {
      imageURL = image.trim();
    } else if (
      image &&
      typeof image === "object"
    ) {
      imageURL =
        image.imageURL ||
        image.ImageURL ||
        image.url ||
        image.URL ||
        "";
    }

    if (imageURL) {
      finalImages.push(imageURL);
    }
  }

  return [
    ...new Set(finalImages),
  ];
};


// =====================================================
// GET QUANTITY
// =====================================================

const getQuantity = (body) => {
  if (
    body.StockQuantity !== undefined &&
    body.StockQuantity !== null &&
    body.StockQuantity !== ""
  ) {
    return (
      Number(body.StockQuantity) || 0
    );
  }

  if (
    body.Quantity !== undefined &&
    body.Quantity !== null &&
    body.Quantity !== ""
  ) {
    return (
      Number(body.Quantity) || 0
    );
  }

  if (
    body.Stock !== undefined &&
    body.Stock !== null &&
    body.Stock !== ""
  ) {
    return (
      Number(body.Stock) || 0
    );
  }

  return 0;
};


// =====================================================
// GET PRICE
// =====================================================

const getPrice = (body) => {
  if (
    body.Price !== undefined &&
    body.Price !== null &&
    body.Price !== ""
  ) {
    return (
      Number(body.Price) || 0
    );
  }

  if (
    body.SellingPrice !== undefined &&
    body.SellingPrice !== null &&
    body.SellingPrice !== ""
  ) {
    return (
      Number(body.SellingPrice) || 0
    );
  }

  if (
    body.LastPurchasePrice !== undefined &&
    body.LastPurchasePrice !== null &&
    body.LastPurchasePrice !== ""
  ) {
    return (
      Number(body.LastPurchasePrice) || 0
    );
  }

  return 0;
};


// =====================================================
// CHECK COLUMN EXISTS
// =====================================================

const hasColumn = async (
  connection,
  tableName,
  columnName
) => {
  const [rows] =
    await connection.query(
      `
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [
        tableName,
        columnName,
      ]
    );

  return (
    Number(
      rows[0]?.total
    ) > 0
  );
};


// =====================================================
// CHECK TABLE EXISTS
// =====================================================

const hasTable = async (
  connection,
  tableName
) => {
  const [rows] =
    await connection.query(
      `
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
      `,
      [tableName]
    );

  return (
    Number(
      rows[0]?.total
    ) > 0
  );
};


// =====================================================
// GENERATE PRODUCT CODE
// =====================================================

const generateProductCode = async (
  connection
) => {
  const [rows] =
    await connection.query(
      `
        SELECT ProductID
        FROM products
        ORDER BY ProductID DESC
        LIMIT 1
      `
    );

  const nextId =
    rows.length > 0
      ? Number(
          rows[0].ProductID
        ) + 1
      : 1;

  return `PRD-${String(
    nextId
  ).padStart(5, "0")}`;
};


// =====================================================
// DELETE PHYSICAL IMAGE
// =====================================================

const deletePhysicalImage = (
  imageURL
) => {
  if (!imageURL) {
    return;
  }

  try {
    const value =
      String(imageURL);

    let filename = "";

    if (
      value.startsWith(
        "/uploads/"
      )
    ) {
      filename =
        path.basename(value);
    } else if (
      value.includes(
        "/uploads/"
      )
    ) {
      filename =
        path.basename(
          value.split(
            "/uploads/"
          )[1]
        );
    } else {
      filename =
        path.basename(value);
    }

    if (!filename) {
      return;
    }

    const filePath =
      path.join(
        process.cwd(),
        "uploads",
        filename
      );

    if (
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "Physical Image Delete Error:",
      error.message
    );
  }
};


// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

export const getProducts = async (
  req,
  res
) => {
  try {
    const hasForWhom =
      await hasColumn(
        pool,
        "products",
        "ForWhom"
      );

    const hasTargetAudience =
      await hasColumn(
        pool,
        "products",
        "TargetAudience"
      );

    const hasBarcodeImage =
      await hasColumn(
        pool,
        "products",
        "BarcodeImageURL"
      );

    let genderSQL =
      "NULL AS ForWhom";

    if (hasForWhom) {
      genderSQL =
        "p.ForWhom AS ForWhom";
    } else if (
      hasTargetAudience
    ) {
      genderSQL =
        "p.TargetAudience AS ForWhom";
    }

    let barcodeSQL =
      "NULL AS BarcodeImageURL";

    if (hasBarcodeImage) {
      barcodeSQL =
        "p.BarcodeImageURL AS BarcodeImageURL";
    }

    const [products] =
      await pool.query(
        `
          SELECT
            p.ProductID,
            p.ProductCode,
            p.ProductName,
            p.ProductType,

            ${genderSQL},

            p.ImageURL,

            ${barcodeSQL},

            COALESCE(
              i.Quantity,
              0
            ) AS StockQuantity,

            COALESCE(
              i.Quantity,
              0
            ) AS Stock,

            COALESCE(
              i.Quantity,
              0
            ) AS Quantity,

            COALESCE(
              i.LastPurchasePrice,
              0
            ) AS Price

          FROM products p

          LEFT JOIN inventory i
            ON i.ProductID =
               p.ProductID

          ORDER BY
            p.ProductID DESC
        `
      );

    // =================================================
    // PRODUCT IMAGES
    // =================================================

    const imageTableExists =
      await hasTable(
        pool,
        "product_images"
      );

    for (
      const product of products
    ) {
      product.Images = [];

      if (imageTableExists) {
        try {
          const [
            images,
          ] =
            await pool.query(
              `
                SELECT
                  ImageID,
                  ImageURL,
                  SortOrder
                FROM product_images
                WHERE ProductID = ?
                ORDER BY
                  SortOrder ASC,
                  ImageID ASC
              `,
              [
                product.ProductID,
              ]
            );

          product.Images =
            images;
        } catch (error) {
          console.warn(
            "Product images load skipped:",
            error.message
          );
        }
      }

      if (
        product.Images.length === 0 &&
        product.ImageURL
      ) {
        product.Images =
          normalizeImageList(
            product.ImageURL
          ).map(
            (
              url,
              index
            ) => ({
              ImageID: null,
              ImageURL: url,
              SortOrder: index,
            })
          );
      }
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "Get Products Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to load products.",
      error:
        error.sqlMessage ||
        error.message,
    });
  }
};


// =====================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// =====================================================

export const getProductById =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      const hasForWhom =
        await hasColumn(
          pool,
          "products",
          "ForWhom"
        );

      const hasTargetAudience =
        await hasColumn(
          pool,
          "products",
          "TargetAudience"
        );

      const hasBarcodeImage =
        await hasColumn(
          pool,
          "products",
          "BarcodeImageURL"
        );

      let genderSQL =
        "NULL AS ForWhom";

      if (hasForWhom) {
        genderSQL =
          "p.ForWhom AS ForWhom";
      } else if (
        hasTargetAudience
      ) {
        genderSQL =
          "p.TargetAudience AS ForWhom";
      }

      let barcodeSQL =
        "NULL AS BarcodeImageURL";

      if (hasBarcodeImage) {
        barcodeSQL =
          "p.BarcodeImageURL AS BarcodeImageURL";
      }

      const [rows] =
        await pool.query(
          `
            SELECT
              p.ProductID,
              p.ProductCode,
              p.ProductName,
              p.ProductType,

              ${genderSQL},

              p.ImageURL,

              ${barcodeSQL},

              COALESCE(
                i.Quantity,
                0
              ) AS StockQuantity,

              COALESCE(
                i.Quantity,
                0
              ) AS Stock,

              COALESCE(
                i.LastPurchasePrice,
                0
              ) AS Price

            FROM products p

            LEFT JOIN inventory i
              ON i.ProductID =
                 p.ProductID

            WHERE
              p.ProductID = ?

            LIMIT 1
          `,
          [id]
        );

      if (
        rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const product =
        rows[0];

      const imageTableExists =
        await hasTable(
          pool,
          "product_images"
        );

      if (imageTableExists) {
        try {
          const [
            images,
          ] =
            await pool.query(
              `
                SELECT
                  ImageID,
                  ImageURL,
                  SortOrder
                FROM product_images
                WHERE ProductID = ?
                ORDER BY
                  SortOrder ASC,
                  ImageID ASC
              `,
              [id]
            );

          product.Images =
            images;
        } catch {
          product.Images = [];
        }
      } else {
        product.Images = [];
      }

      if (
        product.Images.length === 0 &&
        product.ImageURL
      ) {
        product.Images =
          normalizeImageList(
            product.ImageURL
          ).map(
            (
              url,
              index
            ) => ({
              ImageID: null,
              ImageURL: url,
              SortOrder: index,
            })
          );
      }

      return res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error(
        "Get Product By ID Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.sqlMessage ||
          error.message ||
          "Unable to load product.",
        error:
          error.sqlMessage ||
          error.message,
      });
    }
  };


// =====================================================
// UPLOAD SINGLE PRODUCT IMAGE
// POST /api/products/upload-image
// =====================================================

export const uploadProductImage =
  async (
    req,
    res
  ) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "No image uploaded.",
        });
      }

      const imageURL =
        getImageUrl(
          req.file.filename
        );

      return res.status(200).json({
        success: true,
        message:
          "Image uploaded successfully.",

        imageURL,

        imageUrl:
          imageURL,

        ImageURL:
          imageURL,

        url:
          imageURL,

        image:
          imageURL,
      });
    } catch (error) {
      console.error(
        "Upload Product Image Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to upload image.",
        error:
          error.message,
      });
    }
  };


// =====================================================
// UPLOAD MULTIPLE PRODUCT IMAGES
// POST /api/products/upload-images
// =====================================================

export const uploadProductImages =
  async (
    req,
    res
  ) => {
    try {
      if (
        !req.files ||
        req.files.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No images uploaded.",
        });
      }

      const images = [];

      for (
        const file of req.files
      ) {
        const imageURL =
          getImageUrl(
            file.filename
          );

        images.push({
          imageURL,
          ImageURL:
            imageURL,
          url:
            imageURL,
          originalName:
            file.originalname,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Images uploaded successfully.",
        count:
          images.length,
        images,
      });
    } catch (error) {
      console.error(
        "Upload Multiple Product Images Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to upload images.",
        error:
          error.message,
      });
    }
  };


// =====================================================
// CREATE PRODUCT
// POST /api/products
// =====================================================

export const createProduct =
  async (
    req,
    res
  ) => {
    const connection =
      await pool.getConnection();

    try {
      const {
        ProductName,
        ProductType,
        ForWhom,
        TargetAudience,
        Price,
        StockQuantity,
        ImageURL,
        BarcodeImageURL,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !ProductName ||
        !String(
          ProductName
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product Name is required.",
        });
      }

      const normalizedProductType =
        normalizeProductType(
          ProductType
        );

      if (
        !normalizedProductType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product Type is required.",
        });
      }

      const gender =
        String(
          ForWhom ||
          TargetAudience ||
          ""
        ).trim();

      if (!gender) {
        return res.status(400).json({
          success: false,
          message:
            "For Whom / Gender is required.",
        });
      }

      const price =
        getPrice(req.body);

      const quantity =
        getQuantity(req.body);

      if (price < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Price cannot be negative.",
        });
      }

      if (quantity < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Stock quantity cannot be negative.",
        });
      }

      await connection.beginTransaction();

      // =================================================
      // CHECK COLUMNS
      // =================================================

      const hasForWhom =
        await hasColumn(
          connection,
          "products",
          "ForWhom"
        );

      const hasTargetAudience =
        await hasColumn(
          connection,
          "products",
          "TargetAudience"
        );

      const hasBarcodeImage =
        await hasColumn(
          connection,
          "products",
          "BarcodeImageURL"
        );

      const hasPrice =
        await hasColumn(
          connection,
          "products",
          "Price"
        );

      // =================================================
      // AUTOMATIC PRODUCT CODE
      // =================================================

      const productCode =
        await generateProductCode(
          connection
        );

      // =================================================
      // PRODUCT IMAGE
      // =================================================

      const imageList =
        normalizeImageList(
          ImageURL
        );

      const primaryImage =
        imageList.length > 0
          ? imageList[0]
          : ImageURL || null;

      // =================================================
      // BUILD INSERT
      // =================================================

      const columns = [
        "ProductCode",
        "ProductName",
        "ProductType",
        "ImageURL",
      ];

      const values = [
        productCode,
        String(
          ProductName
        ).trim(),
        normalizedProductType,
        primaryImage,
      ];

      const placeholders = [
        "?",
        "?",
        "?",
        "?",
      ];

      // =================================================
      // GENDER
      // =================================================

      if (hasForWhom) {
        columns.push(
          "ForWhom"
        );

        values.push(
          gender
        );

        placeholders.push(
          "?"
        );
      } else if (
        hasTargetAudience
      ) {
        columns.push(
          "TargetAudience"
        );

        values.push(
          gender
        );

        placeholders.push(
          "?"
        );
      }

      // =================================================
      // BARCODE IMAGE
      // =================================================

      if (
        hasBarcodeImage
      ) {
        columns.push(
          "BarcodeImageURL"
        );

        values.push(
          BarcodeImageURL ||
            null
        );

        placeholders.push(
          "?"
        );
      }

      // =================================================
      // PRICE
      // =================================================

      if (hasPrice) {
        columns.push(
          "Price"
        );

        values.push(
          price
        );

        placeholders.push(
          "?"
        );
      }

      // =================================================
      // INSERT PRODUCT
      // =================================================

      const [
        productResult,
      ] =
        await connection.query(
          `
            INSERT INTO products
            (
              ${columns.join(
                ", "
              )}
            )
            VALUES
            (
              ${placeholders.join(
                ", "
              )}
            )
          `,
          values
        );

      const productID =
        productResult.insertId;

      // =================================================
      // INVENTORY
      // =================================================

      const [
        inventoryRows,
      ] =
        await connection.query(
          `
            SELECT
              InventoryID
            FROM inventory
            WHERE ProductID = ?
            LIMIT 1
          `,
          [productID]
        );

      if (
        inventoryRows.length === 0
      ) {
        await connection.query(
          `
            INSERT INTO inventory
            (
              ProductID,
              Quantity,
              ReservedQuantity,
              LastPurchasePrice
            )
            VALUES
            (
              ?,
              ?,
              0,
              ?
            )
          `,
          [
            productID,
            quantity,
            price,
          ]
        );
      } else {
        await connection.query(
          `
            UPDATE inventory
            SET
              Quantity = ?,
              LastPurchasePrice = ?
            WHERE ProductID = ?
          `,
          [
            quantity,
            price,
            productID,
          ]
        );
      }

      // =================================================
      // PRODUCT IMAGES TABLE
      // =================================================

      const imageTableExists =
        await hasTable(
          connection,
          "product_images"
        );

      if (
        imageTableExists &&
        imageList.length > 0
      ) {
        for (
          let i = 0;
          i < imageList.length;
          i++
        ) {
          try {
            await connection.query(
              `
                INSERT INTO product_images
                (
                  ProductID,
                  ImageURL,
                  SortOrder
                )
                VALUES
                (
                  ?,
                  ?,
                  ?
                )
              `,
              [
                productID,
                imageList[i],
                i,
              ]
            );
          } catch (error) {
            console.warn(
              "Product image insert skipped:",
              error.message
            );
          }
        }
      }

      await connection.commit();

      return res.status(201).json({
        success: true,

        message:
          "Product added successfully.",

        productID,

        ProductID:
          productID,

        productCode,

        ProductCode:
          productCode,
      });
    } catch (error) {
      await connection.rollback();

      console.error(
        "Create Product Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.sqlMessage ||
          error.message ||
          "Unable to create product.",
        error:
          error.sqlMessage ||
          error.message,

        code:
          error.code || null,
      });
    } finally {
      connection.release();
    }
  };


// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================

export const updateProduct =
  async (
    req,
    res
  ) => {
    const connection =
      await pool.getConnection();

    try {
      const {
        id,
      } = req.params;

      const {
        ProductName,
        ProductType,
        ForWhom,
        TargetAudience,
        Price,
        StockQuantity,
        ImageURL,
        BarcodeImageURL,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !ProductName ||
        !String(
          ProductName
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product Name is required.",
        });
      }

      const normalizedProductType =
        normalizeProductType(
          ProductType
        );

      if (
        !normalizedProductType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product Type is required.",
        });
      }

      const gender =
        String(
          ForWhom ||
          TargetAudience ||
          ""
        ).trim();

      if (!gender) {
        return res.status(400).json({
          success: false,
          message:
            "For Whom / Gender is required.",
        });
      }

      const price =
        getPrice(req.body);

      const quantity =
        getQuantity(req.body);

      if (
        price < 0 ||
        quantity < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price and stock cannot be negative.",
        });
      }

      await connection.beginTransaction();

      // =================================================
      // CHECK PRODUCT
      // =================================================

      const [
        existingRows,
      ] =
        await connection.query(
          `
            SELECT
              ProductID,
              ProductCode,
              ImageURL
            FROM products
            WHERE ProductID = ?
            LIMIT 1
          `,
          [id]
        );

      if (
        existingRows.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      // =================================================
      // CHECK COLUMNS
      // =================================================

      const hasForWhom =
        await hasColumn(
          connection,
          "products",
          "ForWhom"
        );

      const hasTargetAudience =
        await hasColumn(
          connection,
          "products",
          "TargetAudience"
        );

      const hasBarcodeImage =
        await hasColumn(
          connection,
          "products",
          "BarcodeImageURL"
        );

      const hasPrice =
        await hasColumn(
          connection,
          "products",
          "Price"
        );

      // =================================================
      // BUILD UPDATE
      // =================================================

      const updateParts = [
        "ProductName = ?",
        "ProductType = ?",
      ];

      const values = [
        String(
          ProductName
        ).trim(),

        normalizedProductType,
      ];

      // =================================================
      // GENDER
      // =================================================

      if (hasForWhom) {
        updateParts.push(
          "ForWhom = ?"
        );

        values.push(
          gender
        );
      } else if (
        hasTargetAudience
      ) {
        updateParts.push(
          "TargetAudience = ?"
        );

        values.push(
          gender
        );
      }

      // =================================================
      // PRODUCT IMAGE
      // =================================================

      updateParts.push(
        "ImageURL = ?"
      );

      values.push(
        ImageURL || null
      );

      // =================================================
      // BARCODE IMAGE
      // =================================================

      if (
        hasBarcodeImage
      ) {
        updateParts.push(
          "BarcodeImageURL = ?"
        );

        values.push(
          BarcodeImageURL ||
            null
        );
      }

      // =================================================
      // PRICE
      // =================================================

      if (hasPrice) {
        updateParts.push(
          "Price = ?"
        );

        values.push(
          price
        );
      }

      values.push(id);

      await connection.query(
        `
          UPDATE products
          SET
            ${updateParts.join(
              ", "
            )}
          WHERE ProductID = ?
        `,
        values
      );

      // =================================================
      // UPDATE INVENTORY
      // =================================================

      const [
        inventoryRows,
      ] =
        await connection.query(
          `
            SELECT
              InventoryID
            FROM inventory
            WHERE ProductID = ?
            LIMIT 1
          `,
          [id]
        );

      if (
        inventoryRows.length === 0
      ) {
        await connection.query(
          `
            INSERT INTO inventory
            (
              ProductID,
              Quantity,
              ReservedQuantity,
              LastPurchasePrice
            )
            VALUES
            (
              ?,
              ?,
              0,
              ?
            )
          `,
          [
            id,
            quantity,
            price,
          ]
        );
      } else {
        await connection.query(
          `
            UPDATE inventory
            SET
              Quantity = ?,
              LastPurchasePrice = ?
            WHERE ProductID = ?
          `,
          [
            quantity,
            price,
            id,
          ]
        );
      }

      await connection.commit();

      return res.status(200).json({
        success: true,
        message:
          "Product updated successfully.",
      });
    } catch (error) {
      await connection.rollback();

      console.error(
        "Update Product Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.sqlMessage ||
          error.message ||
          "Unable to update product.",
        error:
          error.sqlMessage ||
          error.message,

        code:
          error.code || null,
      });
    } finally {
      connection.release();
    }
  };


// =====================================================
// DELETE SINGLE PRODUCT IMAGE
// DELETE /api/products/images/:imageId
// =====================================================

export const deleteProductImage =
  async (
    req,
    res
  ) => {
    try {
      const {
        imageId,
      } = req.params;

      const imageTableExists =
        await hasTable(
          pool,
          "product_images"
        );

      if (!imageTableExists) {
        return res.status(404).json({
          success: false,
          message:
            "Product image table not found.",
        });
      }

      const [
        rows,
      ] =
        await pool.query(
          `
            SELECT
              ImageURL
            FROM product_images
            WHERE ImageID = ?
            LIMIT 1
          `,
          [imageId]
        );

      if (
        rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Image not found.",
        });
      }

      const imageURL =
        rows[0].ImageURL;

      await pool.query(
        `
          DELETE FROM product_images
          WHERE ImageID = ?
        `,
        [imageId]
      );

      deletePhysicalImage(
        imageURL
      );

      return res.status(200).json({
        success: true,
        message:
          "Product image deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Product Image Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.sqlMessage ||
          error.message ||
          "Unable to delete product image.",
        error:
          error.sqlMessage ||
          error.message,
      });
    }
  };


// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

export const deleteProduct =
  async (
    req,
    res
  ) => {
    const connection =
      await pool.getConnection();

    try {
      const {
        id,
      } = req.params;

      await connection.beginTransaction();

      // =================================================
      // GET PRODUCT
      // =================================================

      const [
        productRows,
      ] =
        await connection.query(
          `
            SELECT
              ProductID,
              ImageURL
            FROM products
            WHERE ProductID = ?
            LIMIT 1
          `,
          [id]
        );

      if (
        productRows.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      // =================================================
      // GET PRODUCT IMAGES
      // =================================================

      let images = [];

      const imageTableExists =
        await hasTable(
          connection,
          "product_images"
        );

      if (imageTableExists) {
        try {
          const [
            imageRows,
          ] =
            await connection.query(
              `
                SELECT
                  ImageURL
                FROM product_images
                WHERE ProductID = ?
              `,
              [id]
            );

          images =
            imageRows;
        } catch (error) {
          console.warn(
            "Product image read skipped:",
            error.message
          );
        }
      }

      // =================================================
      // DELETE INVENTORY
      // =================================================

      await connection.query(
        `
          DELETE FROM inventory
          WHERE ProductID = ?
        `,
        [id]
      );

      // =================================================
      // DELETE PRODUCT IMAGES
      // =================================================

      if (imageTableExists) {
        try {
          await connection.query(
            `
              DELETE FROM product_images
              WHERE ProductID = ?
            `,
            [id]
          );
        } catch (error) {
          console.warn(
            "Product image delete skipped:",
            error.message
          );
        }
      }

      // =================================================
      // DELETE PRODUCT
      // =================================================

      const [
        result,
      ] =
        await connection.query(
          `
            DELETE FROM products
            WHERE ProductID = ?
          `,
          [id]
        );

      if (
        result.affectedRows === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      await connection.commit();

      // =================================================
      // DELETE PHYSICAL IMAGES
      // =================================================

      for (
        const image of images
      ) {
        deletePhysicalImage(
          image.ImageURL
        );
      }

      const primaryImage =
        productRows[0]
          .ImageURL;

      if (
        primaryImage &&
        !images.some(
          (image) =>
            image.ImageURL ===
            primaryImage
        )
      ) {
        deletePhysicalImage(
          primaryImage
        );
      }

      return res.status(200).json({
        success: true,
        message:
          "Product deleted successfully.",
      });
    } catch (error) {
      await connection.rollback();

      console.error(
        "Delete Product Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.sqlMessage ||
          error.message ||
          "Unable to delete product.",
        error:
          error.sqlMessage ||
          error.message,

        code:
          error.code || null,
      });
    } finally {
      connection.release();
    }
  };


// =====================================================
// GET PRODUCT CATEGORIES
// GET /api/products/categories
// =====================================================

export const getProductCategories =
  async (
    req,
    res
  ) => {
    try {
      const tableExists =
        await hasTable(
          pool,
          "product_categories"
        );

      if (!tableExists) {
        return res.status(200).json({
          success: true,
          categories: [],
        });
      }

      const [
        categories,
      ] =
        await pool.query(
          `
            SELECT
              CategoryID,
              CategoryName
            FROM product_categories
            ORDER BY
              CategoryID ASC
          `
        );

      return res.status(200).json({
        success: true,
        categories,
      });
    } catch (error) {
      console.error(
        "Get Product Categories Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.sqlMessage ||
          error.message ||
          "Unable to load categories.",
        error:
          error.sqlMessage ||
          error.message,
      });
    }
  };


// =====================================================
// GET PRODUCT BRANDS
// GET /api/products/brands
// =====================================================

export const getProductBrands =
  async (
    req,
    res
  ) => {
    try {
      const tableExists =
        await hasTable(
          pool,
          "brands"
        );

      if (!tableExists) {
        return res.status(200).json({
          success: true,
          brands: [],
        });
      }

      const [
        brands,
      ] =
        await pool.query(
          `
            SELECT
              BrandID,
              BrandName
            FROM brands
            ORDER BY
              BrandID ASC
          `
        );

      return res.status(200).json({
        success: true,
        brands,
      });
    } catch (error) {
      console.error(
        "Get Product Brands Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.sqlMessage ||
          error.message ||
          "Unable to load brands.",
        error:
          error.sqlMessage ||
          error.message,
      });
    }
  };