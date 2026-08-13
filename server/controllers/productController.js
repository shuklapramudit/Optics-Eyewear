import pool from "../config/db.js";
import fs from "fs";
import path from "path";

// =====================================================
// IMAGE URL HELPER
// =====================================================

const getImageUrl = (filename) => {
  return `/uploads/${filename}`;
};

// =====================================================
// PRODUCT TYPE NORMALIZER
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

    "Sunglasses": "Sunglasses",

    "Frame": "Frame",
    "Lens": "Lens",

    "Accessory": "Accessory",
    "Accessories": "Accessory",

    "Lens Care": "Accessory",

    "Other": "Other",
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
  const parsedImages =
    parseImages(images);

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

  return [...new Set(finalImages)];
};

// =====================================================
// GET QUANTITY
// =====================================================

const getQuantity = (body) => {
  if (
    body.Quantity !== undefined &&
    body.Quantity !== null &&
    body.Quantity !== ""
  ) {
    return Number(body.Quantity) || 0;
  }

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
    body.Stock !== undefined &&
    body.Stock !== null &&
    body.Stock !== ""
  ) {
    return Number(body.Stock) || 0;
  }

  return 0;
};

// =====================================================
// GET PRICE
// =====================================================

const getPrice = (body) => {
  if (
    body.LastPurchasePrice !==
      undefined &&
    body.LastPurchasePrice !== null &&
    body.LastPurchasePrice !== ""
  ) {
    return (
      Number(body.LastPurchasePrice) || 0
    );
  }

  if (
    body.Price !== undefined &&
    body.Price !== null &&
    body.Price !== ""
  ) {
    return Number(body.Price) || 0;
  }

  return 0;
};

// =====================================================
// RESOLVE CATEGORY
// =====================================================

const resolveCategoryId = async (
  connection,
  categoryID,
  categoryName
) => {
  if (
    categoryName &&
    String(categoryName).trim()
  ) {
    const name =
      String(categoryName).trim();

    const [existing] =
      await connection.query(
        `
        SELECT
          CategoryID

        FROM product_categories

        WHERE
          LOWER(CategoryName) =
          LOWER(?)

        LIMIT 1
        `,
        [name]
      );

    if (existing.length > 0) {
      return existing[0].CategoryID;
    }

    const [result] =
      await connection.query(
        `
        INSERT INTO product_categories
        (
          CategoryName
        )

        VALUES
        (?)
        `,
        [name]
      );

    return result.insertId;
  }

  return categoryID
    ? Number(categoryID)
    : null;
};

// =====================================================
// RESOLVE BRAND
// =====================================================

const resolveBrandId = async (
  connection,
  brandID,
  brandName
) => {
  if (
    brandName &&
    String(brandName).trim()
  ) {
    const name =
      String(brandName).trim();

    const [existing] =
      await connection.query(
        `
        SELECT
          BrandID

        FROM brands

        WHERE
          LOWER(BrandName) =
          LOWER(?)

        LIMIT 1
        `,
        [name]
      );

    if (existing.length > 0) {
      return existing[0].BrandID;
    }

    const [result] =
      await connection.query(
        `
        INSERT INTO brands
        (
          BrandName
        )

        VALUES
        (?)
        `,
        [name]
      );

    return result.insertId;
  }

  return brandID
    ? Number(brandID)
    : null;
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
    let filename = "";

    if (
      imageURL.startsWith(
        "/uploads/"
      )
    ) {
      filename =
        path.basename(imageURL);
    } else if (
      imageURL.includes(
        "/uploads/"
      )
    ) {
      filename =
        path.basename(
          imageURL.split(
            "/uploads/"
          )[1]
        );
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
      "Physical image delete error:",
      error.message
    );
  }
};

// =====================================================
// GENERATE PRODUCT CODE
// =====================================================

const generateProductCode =
  async (connection) => {
    const [rows] =
      await connection.query(
        `
        SELECT
          ProductID

        FROM products

        ORDER BY
          ProductID DESC

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
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

export const getProducts =
  async (req, res) => {
    try {
      const [products] =
        await pool.query(
          `
          SELECT
            p.ProductID,
            p.ProductCode,
            p.Barcode,
            p.ProductName,

            p.CategoryID,
            p.BrandID,

            p.ProductType,
            p.Description,
            p.ModelNumber,
            p.Color,
            p.Size,
            p.ImageURL,

            COALESCE(
              i.Quantity,
              0
            ) AS Stock,

            COALESCE(
              i.LastPurchasePrice,
              0
            ) AS Price,

            pc.CategoryName,

            b.BrandName

          FROM products p

          LEFT JOIN inventory i
            ON i.ProductID =
               p.ProductID

          LEFT JOIN product_categories pc
            ON pc.CategoryID =
               p.CategoryID

          LEFT JOIN brands b
            ON b.BrandID =
               p.BrandID

          ORDER BY
            p.ProductID DESC
          `
        );

      for (
        const product of products
      ) {
        const [images] =
          await pool.query(
            `
            SELECT
              ImageID,
              ImageURL,
              SortOrder

            FROM product_images

            WHERE
              ProductID = ?

            ORDER BY
              SortOrder ASC,
              ImageID ASC
            `,
            [product.ProductID]
          );

        product.Images =
          images;

        if (
          images.length === 0 &&
          product.ImageURL
        ) {
          const fallbackImages =
            normalizeImageList(
              product.ImageURL
            );

          product.Images =
            fallbackImages.map(
              (url, index) => ({
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
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const [products] =
        await pool.query(
          `
          SELECT
            p.ProductID,
            p.ProductCode,
            p.Barcode,
            p.ProductName,

            p.CategoryID,
            p.BrandID,

            p.ProductType,
            p.Description,
            p.ModelNumber,
            p.Color,
            p.Size,
            p.ImageURL,

            COALESCE(
              i.Quantity,
              0
            ) AS Stock,

            COALESCE(
              i.LastPurchasePrice,
              0
            ) AS Price,

            pc.CategoryName,

            b.BrandName

          FROM products p

          LEFT JOIN inventory i
            ON i.ProductID =
               p.ProductID

          LEFT JOIN product_categories pc
            ON pc.CategoryID =
               p.CategoryID

          LEFT JOIN brands b
            ON b.BrandID =
               p.BrandID

          WHERE
            p.ProductID = ?

          LIMIT 1
          `,
          [id]
        );

      if (
        products.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const product =
        products[0];

      const [images] =
        await pool.query(
          `
          SELECT
            ImageID,
            ImageURL,
            SortOrder

          FROM product_images

          WHERE
            ProductID = ?

          ORDER BY
            SortOrder ASC,
            ImageID ASC
          `,
          [id]
        );

      product.Images =
        images;

      if (
        images.length === 0 &&
        product.ImageURL
      ) {
        const fallbackImages =
          normalizeImageList(
            product.ImageURL
          );

        product.Images =
          fallbackImages.map(
            (url, index) => ({
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
        "Get Product Error:",
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
// GET CATEGORIES
// GET /api/products/categories
// =====================================================

export const getProductCategories =
  async (req, res) => {
    try {
      const [categories] =
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
        "Get Categories Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to load categories.",
        error:
          error.message,
      });
    }
  };

// =====================================================
// GET BRANDS
// GET /api/products/brands
// =====================================================

export const getProductBrands =
  async (req, res) => {
    try {
      const [brands] =
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
        "Get Brands Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to load brands.",
        error:
          error.message,
      });
    }
  };

// =====================================================
// UPLOAD SINGLE PRODUCT IMAGE
// POST /api/products/upload-image
// =====================================================

export const uploadProductImage =
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "No image uploaded.",
        });
      }

      const extension =
        path.extname(
          req.file.originalname
        );

      const oldPath =
        req.file.path;

      const newFilename =
        `${req.file.filename}${extension}`;

      const newPath =
        path.join(
          path.dirname(oldPath),
          newFilename
        );

      fs.renameSync(
        oldPath,
        newPath
      );

      const imageURL =
        getImageUrl(
          newFilename
        );

      return res.status(200).json({
        success: true,
        message:
          "Image uploaded successfully.",
        imageURL,
        image: imageURL,
      });
    } catch (error) {
      console.error(
        "Upload Image Error:",
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
  async (req, res) => {
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
        const extension =
          path.extname(
            file.originalname
          );

        const oldPath =
          file.path;

        const newFilename =
          `${file.filename}${extension}`;

        const newPath =
          path.join(
            path.dirname(oldPath),
            newFilename
          );

        fs.renameSync(
          oldPath,
          newPath
        );

        images.push({
          imageURL:
            getImageUrl(
              newFilename
            ),
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
        "Upload Multiple Images Error:",
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
  async (req, res) => {
    const connection =
      await pool.getConnection();

    try {
      const {
        ProductCode,
        Barcode,
        ProductName,

        CategoryID,
        CategoryName,

        BrandID,
        BrandName,

        ProductType,
        Description,
        ModelNumber,
        Color,
        Size,

        ImageURL,
        Images,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !ProductName ||
        !String(ProductName).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required.",
        });
      }

      const normalizedProductType =
        normalizeProductType(
          ProductType
        );

      if (!normalizedProductType) {
        return res.status(400).json({
          success: false,
          message:
            "Product type is required.",
        });
      }

      // =================================================
      // START TRANSACTION
      // =================================================

      await connection.beginTransaction();

      // =================================================
      // CATEGORY
      // =================================================

      const resolvedCategoryID =
        await resolveCategoryId(
          connection,
          CategoryID,
          CategoryName
        );

      if (
        !resolvedCategoryID ||
        Number.isNaN(
          Number(resolvedCategoryID)
        )
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Valid category is required.",
        });
      }

      // =================================================
      // BRAND
      // =================================================

      const resolvedBrandID =
        await resolveBrandId(
          connection,
          BrandID,
          BrandName
        );

      // =================================================
      // PRODUCT CODE
      // =================================================

      const finalProductCode =
        ProductCode &&
        String(ProductCode).trim()
          ? String(ProductCode).trim()
          : await generateProductCode(
              connection
            );

      // =================================================
      // IMAGES
      // =================================================

      let imageList =
        normalizeImageList(
          Images
        );

      const primaryImages =
        normalizeImageList(
          ImageURL
        );

      imageList = [
        ...imageList,
        ...primaryImages,
      ];

      imageList = [
        ...new Set(imageList),
      ];

      const primaryImage =
        imageList.length > 0
          ? imageList[0]
          : null;

      // =================================================
      // INVENTORY
      // =================================================

      const quantity =
        getQuantity(req.body);

      const price =
        getPrice(req.body);

      // =================================================
      // INSERT PRODUCT
      // =================================================

      const [productResult] =
        await connection.query(
          `
          INSERT INTO products
          (
            ProductCode,
            Barcode,
            ProductName,

            CategoryID,
            BrandID,

            ProductType,
            Description,
            ModelNumber,
            Color,
            Size,

            ImageURL
          )

          VALUES
          (
            ?,
            ?,
            ?,

            ?,
            ?,

            ?,
            ?,
            ?,
            ?,
            ?,

            ?
          )
          `,
          [
            finalProductCode,
            Barcode || null,
            String(ProductName).trim(),

            Number(
              resolvedCategoryID
            ),

            resolvedBrandID
              ? Number(
                  resolvedBrandID
                )
              : null,

            normalizedProductType,

            Description || null,
            ModelNumber || null,
            Color || null,
            Size || null,

            primaryImage,
          ]
        );

      const productID =
        productResult.insertId;

      // =================================================
      // INSERT INVENTORY
      // =================================================

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
          ?,
          ?
        )
        `,
        [
          productID,
          quantity,
          0,
          price,
        ]
      );

      // =================================================
      // INSERT IMAGES
      // =================================================

      for (
        let i = 0;
        i < imageList.length;
        i++
      ) {
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
      }

      // =================================================
      // COMMIT
      // =================================================

      await connection.commit();

      return res.status(201).json({
        success: true,
        message:
          "Product created successfully.",
        productID,
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
  async (req, res) => {
    const connection =
      await pool.getConnection();

    try {
      const { id } =
        req.params;

      const {
        ProductCode,
        Barcode,
        ProductName,

        CategoryID,
        CategoryName,

        BrandID,
        BrandName,

        ProductType,
        Description,
        ModelNumber,
        Color,
        Size,

        ImageURL,
        Images,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !ProductName ||
        !String(ProductName).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required.",
        });
      }

      const normalizedProductType =
        normalizeProductType(
          ProductType
        );

      if (!normalizedProductType) {
        return res.status(400).json({
          success: false,
          message:
            "Product type is required.",
        });
      }

      // =================================================
      // START TRANSACTION
      // =================================================

      await connection.beginTransaction();

      // =================================================
      // CHECK PRODUCT
      // =================================================

      const [existingProduct] =
        await connection.query(
          `
          SELECT
            ProductID,
            ProductCode

          FROM products

          WHERE
            ProductID = ?

          LIMIT 1
          `,
          [id]
        );

      if (
        existingProduct.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      // =================================================
      // CATEGORY
      // =================================================

      const resolvedCategoryID =
        await resolveCategoryId(
          connection,
          CategoryID,
          CategoryName
        );

      if (
        !resolvedCategoryID ||
        Number.isNaN(
          Number(resolvedCategoryID)
        )
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Valid category is required.",
        });
      }

      // =================================================
      // BRAND
      // =================================================

      const resolvedBrandID =
        await resolveBrandId(
          connection,
          BrandID,
          BrandName
        );

      // =================================================
      // PRODUCT CODE
      // =================================================

      const finalProductCode =
        ProductCode &&
        String(ProductCode).trim()
          ? String(ProductCode).trim()
          : existingProduct[0]
              .ProductCode;

      // =================================================
      // IMAGE DATA
      // =================================================

      let imageList =
        normalizeImageList(
          Images
        );

      const primaryImages =
        normalizeImageList(
          ImageURL
        );

      imageList = [
        ...imageList,
        ...primaryImages,
      ];

      imageList = [
        ...new Set(imageList),
      ];

      // =================================================
      // GET EXISTING IMAGES
      // =================================================

      const [existingImages] =
        await connection.query(
          `
          SELECT
            ImageID,
            ImageURL,
            SortOrder

          FROM product_images

          WHERE
            ProductID = ?

          ORDER BY
            SortOrder ASC,
            ImageID ASC
          `,
          [id]
        );

      // =================================================
      // PRIMARY IMAGE
      // =================================================

      let primaryImage = null;

      if (
        imageList.length > 0
      ) {
        primaryImage =
          imageList[0];
      } else if (
        existingImages.length > 0
      ) {
        primaryImage =
          existingImages[0]
            .ImageURL;
      }

      // =================================================
      // UPDATE PRODUCT
      // =================================================

      await connection.query(
        `
        UPDATE products

        SET
          ProductCode = ?,
          Barcode = ?,
          ProductName = ?,

          CategoryID = ?,
          BrandID = ?,

          ProductType = ?,
          Description = ?,
          ModelNumber = ?,
          Color = ?,
          Size = ?,

          ImageURL = ?

        WHERE
          ProductID = ?
        `,
        [
          finalProductCode,
          Barcode || null,
          String(ProductName).trim(),

          Number(
            resolvedCategoryID
          ),

          resolvedBrandID
            ? Number(
                resolvedBrandID
              )
            : null,

          normalizedProductType,

          Description || null,
          ModelNumber || null,
          Color || null,
          Size || null,

          primaryImage,

          id,
        ]
      );

      // =================================================
      // INVENTORY VALUES
      // =================================================

      const quantity =
        getQuantity(req.body);

      const price =
        getPrice(req.body);

      // =================================================
      // CHECK INVENTORY
      // =================================================

      const [inventoryRows] =
        await connection.query(
          `
          SELECT
            InventoryID

          FROM inventory

          WHERE
            ProductID = ?

          LIMIT 1
          `,
          [id]
        );

      // =================================================
      // CREATE INVENTORY
      // =====================================================

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
            ?,
            ?
          )
          `,
          [
            id,
            quantity,
            0,
            price,
          ]
        );
      } else {
        // =================================================
        // UPDATE INVENTORY
        // =================================================

        await connection.query(
          `
          UPDATE inventory

          SET
            Quantity = ?,
            LastPurchasePrice = ?

          WHERE
            ProductID = ?
          `,
          [
            quantity,
            price,
            id,
          ]
        );
      }

      // =================================================
      // ADD NEW IMAGES
      // =================================================

      if (
        imageList.length > 0
      ) {
        const existingURLSet =
          new Set(
            existingImages.map(
              (image) =>
                image.ImageURL
            )
          );

        const [sortRows] =
          await connection.query(
            `
            SELECT
              COALESCE(
                MAX(SortOrder),
                -1
              ) AS MaxSort

            FROM product_images

            WHERE
              ProductID = ?
            `,
            [id]
          );

        let sortOrder =
          Number(
            sortRows[0].MaxSort
          ) + 1;

        for (
          const imageURL of
          imageList
        ) {
          if (
            !existingURLSet.has(
              imageURL
            )
          ) {
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
                id,
                imageURL,
                sortOrder,
              ]
            );

            sortOrder++;

            existingURLSet.add(
              imageURL
            );
          }
        }
      }

      // =================================================
      // COMMIT
      // =================================================

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
  async (req, res) => {
    try {
      const {
        imageId,
      } = req.params;

      const [rows] =
        await pool.query(
          `
          SELECT
            ImageURL

          FROM product_images

          WHERE
            ImageID = ?

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

        WHERE
          ImageID = ?
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
  async (req, res) => {
    const connection =
      await pool.getConnection();

    try {
      const { id } =
        req.params;

      await connection.beginTransaction();

      // =================================================
      // CHECK PRODUCT
      // =================================================

      const [productRows] =
        await connection.query(
          `
          SELECT
            ProductID,
            ImageURL

          FROM products

          WHERE
            ProductID = ?

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

      const [images] =
        await connection.query(
          `
          SELECT
            ImageURL

          FROM product_images

          WHERE
            ProductID = ?
          `,
          [id]
        );

      // =================================================
      // DELETE INVENTORY
      // =================================================

      await connection.query(
        `
        DELETE FROM inventory

        WHERE
          ProductID = ?
        `,
        [id]
      );

      // =================================================
      // DELETE PRODUCT IMAGES
      // =================================================

      await connection.query(
        `
        DELETE FROM product_images

        WHERE
          ProductID = ?
        `,
        [id]
      );

      // =================================================
      // DELETE PRODUCT
      // =================================================

      const [result] =
        await connection.query(
          `
          DELETE FROM products

          WHERE
            ProductID = ?
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

      // =================================================
      // COMMIT
      // =================================================

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

      // =================================================
      // DELETE PRIMARY IMAGE
      // =================================================

      const primaryImage =
        productRows[0].ImageURL;

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