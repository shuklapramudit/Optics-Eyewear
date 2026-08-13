import pool from "../config/db.js";

import fs from "fs";
import path from "path";
import crypto from "crypto";

// =====================================================
// IMAGE URL HELPER
// =====================================================

const getImageUrl = (filename) => {
  if (!filename) {
    return "";
  }

  const baseUrl =
    process.env.SERVER_URL ||
    process.env.API_BASE_URL ||
    "";

  const cleanBaseUrl =
    String(baseUrl).replace(/\/$/, "");

  return `${cleanBaseUrl}/uploads/${filename}`;
};

// =====================================================
// NORMALIZE IMAGE URL
// =====================================================

const normalizeImageUrl = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleanValue =
    value.trim();

  if (!cleanValue) {
    return null;
  }

  return cleanValue;
};

// =====================================================
// NORMALIZE PRODUCT TYPE
// =====================================================

const normalizeProductType = (
  value
) => {
  if (!value) {
    return "";
  }

  const type =
    String(value).trim();

  const allowedTypes = [
    "Frame",
    "Lens",
    "Sunglasses",
    "Contact Lens",
    "Accessory",
  ];

  const matchedType =
    allowedTypes.find(
      (item) =>
        item.toLowerCase() ===
        type.toLowerCase()
    );

  return matchedType || type;
};

// =====================================================
// NORMALIZE GENDER
// =====================================================

const normalizeForWhom = (
  value
) => {
  if (!value) {
    return "";
  }

  const gender =
    String(value).trim();

  const allowedValues = [
    "Men",
    "Women",
    "Kids",
    "Unisex",
  ];

  const matchedValue =
    allowedValues.find(
      (item) =>
        item.toLowerCase() ===
        gender.toLowerCase()
    );

  return matchedValue || "";
};

// =====================================================
// GENERATE TEMP PRODUCT CODE
// =====================================================

const generateTemporaryCode = () => {
  return `TMP-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

// =====================================================
// GENERATE FINAL PRODUCT CODE
// =====================================================

const generateProductCode = (
  productId
) => {
  return `PRD-${String(
    productId
  ).padStart(5, "0")}`;
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
    const [
      products,
    ] = await pool.query(`
      SELECT

        p.ProductID,

        p.ProductCode,

        p.ProductName,

        p.ProductType,

        p.ForWhom,

        p.ImageURL,

        p.BarcodeImageURL,

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
        ) AS Price,

        COALESCE(
          i.LastPurchasePrice,
          0
        ) AS SellingPrice,

        COALESCE(
          i.LastPurchasePrice,
          0
        ) AS LastPurchasePrice

      FROM products p

      LEFT JOIN inventory i
        ON i.ProductID =
           p.ProductID

      ORDER BY
        p.ProductID DESC
    `);

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

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID is required.",
        });
      }

      const [
        products,
      ] = await pool.query(
        `
        SELECT

          p.ProductID,

          p.ProductCode,

          p.ProductName,

          p.ProductType,

          p.ForWhom,

          p.ImageURL,

          p.BarcodeImageURL,

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
          ) AS Price,

          COALESCE(
            i.LastPurchasePrice,
            0
          ) AS SellingPrice,

          COALESCE(
            i.LastPurchasePrice,
            0
          ) AS LastPurchasePrice

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
        products.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      return res.status(200).json({
        success: true,
        product:
          products[0],
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
// UPLOAD SINGLE IMAGE
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

      const extension =
        path.extname(
          req.file.originalname
        ) || ".jpg";

      const oldPath =
        req.file.path;

      const newFilename =
        `${req.file.filename}${extension}`;

      const newPath =
        path.join(
          path.dirname(oldPath),
          newFilename
        );

      if (
        oldPath !== newPath &&
        fs.existsSync(oldPath)
      ) {
        fs.renameSync(
          oldPath,
          newPath
        );
      }

      const imageURL =
        getImageUrl(
          newFilename
        );

      return res.status(200).json({
        success: true,
        message:
          "Image uploaded successfully.",

        imageURL,

        image:
          imageURL,

        url:
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

      if (!normalizedProductType) {
        return res.status(400).json({
          success: false,
          message:
            "Product Type is required.",
        });
      }

      const normalizedForWhom =
        normalizeForWhom(
          ForWhom
        );

      if (!normalizedForWhom) {
        return res.status(400).json({
          success: false,
          message:
            "For Whom / Gender is required.",
        });
      }

      const numericPrice =
        Number(Price);

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Price is required.",
        });
      }

      const numericStock =
        Number(StockQuantity);

      if (
        !Number.isFinite(
          numericStock
        ) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Stock Quantity is required.",
        });
      }

      const productImage =
        normalizeImageUrl(
          ImageURL
        );

      const barcodeImage =
        normalizeImageUrl(
          BarcodeImageURL
        );

      // =================================================
      // START TRANSACTION
      // =================================================

      await connection.beginTransaction();

      // =================================================
      // TEMPORARY PRODUCT CODE
      // =================================================

      const temporaryCode =
        generateTemporaryCode();

      // =================================================
      // INSERT PRODUCT
      //
      // CategoryID intentionally NOT used.
      // BrandID intentionally NOT used.
      // =================================================

      const [
        productResult,
      ] =
        await connection.query(
          `
          INSERT INTO products
          (
            ProductCode,
            ProductName,
            ProductType,
            ForWhom,
            ImageURL,
            BarcodeImageURL
          )

          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
          `,
          [
            temporaryCode,

            String(
              ProductName
            ).trim(),

            normalizedProductType,

            normalizedForWhom,

            productImage,

            barcodeImage,
          ]
        );

      const productId =
        productResult.insertId;

      // =================================================
      // GENERATE FINAL PRODUCT CODE
      // =================================================

      const productCode =
        generateProductCode(
          productId
        );

      await connection.query(
        `
        UPDATE products

        SET ProductCode = ?

        WHERE ProductID = ?
        `,
        [
          productCode,
          productId,
        ]
      );

      // =================================================
      // CREATE INVENTORY
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
          productId,

          numericStock,

          0,

          numericPrice,
        ]
      );

      // =================================================
      // COMMIT
      // =================================================

      await connection.commit();

      return res.status(201).json({
        success: true,

        message:
          "Product added successfully.",

        product: {
          ProductID:
            productId,

          ProductCode:
            productCode,

          ProductName:
            String(
              ProductName
            ).trim(),

          ProductType:
            normalizedProductType,

          ForWhom:
            normalizedForWhom,

          Price:
            numericPrice,

          StockQuantity:
            numericStock,

          ImageURL:
            productImage,

          BarcodeImageURL:
            barcodeImage,
        },
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

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID is required.",
        });
      }

      const {
        ProductName,
        ProductType,
        ForWhom,
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

      if (!normalizedProductType) {
        return res.status(400).json({
          success: false,
          message:
            "Product Type is required.",
        });
      }

      const normalizedForWhom =
        normalizeForWhom(
          ForWhom
        );

      if (!normalizedForWhom) {
        return res.status(400).json({
          success: false,
          message:
            "For Whom / Gender is required.",
        });
      }

      const numericPrice =
        Number(Price);

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Price is required.",
        });
      }

      const numericStock =
        Number(StockQuantity);

      if (
        !Number.isFinite(
          numericStock
        ) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Stock Quantity is required.",
        });
      }

      const productImage =
        normalizeImageUrl(
          ImageURL
        );

      const barcodeImage =
        normalizeImageUrl(
          BarcodeImageURL
        );

      // =================================================
      // START TRANSACTION
      // =================================================

      await connection.beginTransaction();

      // =================================================
      // CHECK PRODUCT
      // =================================================

      const [
        existingProducts,
      ] =
        await connection.query(
          `
          SELECT
            ProductID,
            ProductCode

          FROM products

          WHERE ProductID = ?

          LIMIT 1
          `,
          [id]
        );

      if (
        existingProducts.length ===
        0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      // =================================================
      // UPDATE PRODUCT
      // =================================================

      await connection.query(
        `
        UPDATE products

        SET
          ProductName = ?,
          ProductType = ?,
          ForWhom = ?,
          ImageURL = ?,
          BarcodeImageURL = ?

        WHERE ProductID = ?
        `,
        [
          String(
            ProductName
          ).trim(),

          normalizedProductType,

          normalizedForWhom,

          productImage,

          barcodeImage,

          id,
        ]
      );

      // =================================================
      // CHECK INVENTORY
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

      // =================================================
      // UPDATE EXISTING INVENTORY
      // =================================================

      if (
        inventoryRows.length > 0
      ) {

        await connection.query(
          `
          UPDATE inventory

          SET
            Quantity = ?,
            LastPurchasePrice = ?

          WHERE ProductID = ?
          `,
          [
            numericStock,

            numericPrice,

            id,
          ]
        );

      } else {

        // ===============================================
        // CREATE INVENTORY IF MISSING
        // ===============================================

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

            numericStock,

            0,

            numericPrice,
          ]
        );
      }

      // =================================================
      // COMMIT
      // =================================================

      await connection.commit();

      return res.status(200).json({
        success: true,

        message:
          "Product updated successfully.",

        product: {
          ProductID:
            Number(id),

          ProductCode:
            existingProducts[0]
              .ProductCode,

          ProductName:
            String(
              ProductName
            ).trim(),

          ProductType:
            normalizedProductType,

          ForWhom:
            normalizedForWhom,

          Price:
            numericPrice,

          StockQuantity:
            numericStock,

          ImageURL:
            productImage,

          BarcodeImageURL:
            barcodeImage,
        },
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
      });

    } finally {

      connection.release();
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

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID is required.",
        });
      }

      await connection.beginTransaction();

      // =================================================
      // GET PRODUCT
      // =================================================

      const [
        products,
      ] =
        await connection.query(
          `
          SELECT
            ProductID,
            ImageURL,
            BarcodeImageURL

          FROM products

          WHERE ProductID = ?

          LIMIT 1
          `,
          [id]
        );

      if (
        products.length ===
        0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const product =
        products[0];

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
      // DELETE INVENTORY TRANSACTIONS
      //
      // Only if table exists.
      // =================================================

      try {

        await connection.query(
          `
          DELETE FROM inventory_transactions

          WHERE ProductID = ?
          `,
          [id]
        );

      } catch (
        transactionDeleteError
      ) {

        console.warn(
          "Inventory transaction delete skipped:",
          transactionDeleteError.message
        );
      }

      // =================================================
      // DELETE PRODUCT IMAGES
      //
      // Old system may have this table.
      // =================================================

      try {

        await connection.query(
          `
          DELETE FROM product_images

          WHERE ProductID = ?
          `,
          [id]
        );

      } catch (
        imageTableError
      ) {

        console.warn(
          "Product images table delete skipped:",
          imageTableError.message
        );
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
        result.affectedRows ===
        0
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
      // DELETE PHYSICAL PRODUCT IMAGE
      // =================================================

      deletePhysicalImage(
        product.ImageURL
      );

      // =================================================
      // DELETE PHYSICAL BARCODE IMAGE
      // =================================================

      deletePhysicalImage(
        product.BarcodeImageURL
      );

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
      });

    } finally {

      connection.release();
    }
  };

// =====================================================
// DELETE PHYSICAL IMAGE
// =====================================================

const deletePhysicalImage = (
  imageURL
) => {

  try {

    if (!imageURL) {
      return;
    }

    const cleanURL =
      String(
        imageURL
      ).trim();

    if (
      !cleanURL.includes(
        "/uploads/"
      )
    ) {
      return;
    }

    const filename =
      path.basename(
        cleanURL
      );

    if (!filename) {
      return;
    }

    const uploadPath =
      path.join(
        process.cwd(),
        "uploads",
        filename
      );

    if (
      fs.existsSync(
        uploadPath
      )
    ) {

      fs.unlinkSync(
        uploadPath
      );
    }

  } catch (error) {

    console.warn(
      "Physical image delete failed:",
      error.message
    );
  }
};

// =====================================================
// GET CATEGORIES
//
// Kept only for backward compatibility
// with old routes.
// =====================================================

export const getProductCategories =
  async (
    req,
    res
  ) => {

    try {

      const [
        categories,
      ] =
        await pool.query(`
          SELECT
            CategoryID,
            CategoryName

          FROM product_categories

          ORDER BY
            CategoryID ASC
        `);

      return res.status(200).json({
        success: true,
        categories,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to load categories.",
      });
    }
  };

// =====================================================
// GET BRANDS
//
// Kept only for backward compatibility
// with old routes.
// =====================================================

export const getProductBrands =
  async (
    req,
    res
  ) => {

    try {

      const [
        brands,
      ] =
        await pool.query(`
          SELECT
            BrandID,
            BrandName

          FROM brands

          ORDER BY
            BrandID ASC
        `);

      return res.status(200).json({
        success: true,
        brands,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to load brands.",
      });
    }
  };