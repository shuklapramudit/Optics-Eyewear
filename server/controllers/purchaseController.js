import pool from "../config/db.js";

// =====================================================
// GET PURCHASE FORM DATA
// GET /api/purchases/form-data
// =====================================================

export const getPurchaseFormData = async (req, res) => {
  try {
    const [suppliers] = await pool.query(`
      SELECT
        SupplierID,
        SupplierName
      FROM suppliers
      ORDER BY SupplierName ASC
    `);

    const [products] = await pool.query(`
      SELECT
        ProductID,
        ProductCode,
        ProductName,
        CostPrice,
        GSTPercent,
        Unit,
        IsActive
      FROM products
      WHERE IsActive = 1
      ORDER BY ProductName ASC
    `);

    res.status(200).json({
      success: true,
      suppliers,
      products
    });

  } catch (error) {
    console.error(
      "Get Purchase Form Data Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to load purchase form data.",
      error: error.message
    });
  }
};

// =====================================================
// CREATE PURCHASE
// POST /api/purchases/create
// =====================================================

export const createPurchase = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      SupplierID,
      ManualSupplierName,
      SupplierInvoiceNumber,
      PurchaseDate,
      Discount = 0,
      PaymentStatus = "Pending",
      Notes,
      items = []
    } = req.body;

    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (
      !SupplierID &&
      !String(ManualSupplierName || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a supplier or enter supplier name manually."
      });
    }

    if (!PurchaseDate) {
      return res.status(400).json({
        success: false,
        message: "Purchase date is required."
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one purchase item is required."
      });
    }

    // =================================================
    // VALIDATE ITEMS
    // =================================================

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      const hasProduct =
        item.ProductID !== null &&
        item.ProductID !== undefined &&
        String(item.ProductID).trim() !== "";

      const hasManualProduct =
        String(item.ManualProductName || "").trim() !== "";

      if (!hasProduct && !hasManualProduct) {
        return res.status(400).json({
          success: false,
          message:
            `Product is required for item ${index + 1}.`
        });
      }

      if (Number(item.Quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message:
            `Quantity must be greater than 0 for item ${index + 1}.`
        });
      }

      if (
        item.UnitPrice === undefined ||
        item.UnitPrice === null ||
        Number(item.UnitPrice) < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Valid unit price is required for item ${index + 1}.`
        });
      }
    }

    // =================================================
    // CALCULATE TOTALS
    // =================================================

    let subTotal = 0;
    let gstAmount = 0;

    const preparedItems = items.map((item) => {
      const quantity =
        Number(item.Quantity) || 0;

      const unitPrice =
        Number(item.UnitPrice) || 0;

      const gstPercent =
        Number(item.GSTPercent) || 0;

      const lineSubTotal =
        quantity * unitPrice;

      const lineGST =
        lineSubTotal * gstPercent / 100;

      const totalAmount =
        lineSubTotal + lineGST;

      subTotal += lineSubTotal;
      gstAmount += lineGST;

      return {
        ProductID:
          item.ProductID
            ? Number(item.ProductID)
            : null,

        ManualProductName:
          String(
            item.ManualProductName || ""
          ).trim() || null,

        Quantity: quantity,

        UnitPrice: unitPrice,

        GSTPercent: gstPercent,

        GSTAmount: lineGST,

        TotalAmount: totalAmount
      };
    });

    const discountAmount =
      Math.max(
        0,
        Number(Discount) || 0
      );

    const taxableAmount =
      Math.max(
        0,
        subTotal - discountAmount
      );

    const grandTotal =
      taxableAmount + gstAmount;

    // =================================================
    // GENERATE PURCHASE NUMBER
    // =================================================

    const [lastPurchase] =
      await connection.query(`
        SELECT PurchaseID
        FROM purchases
        ORDER BY PurchaseID DESC
        LIMIT 1
      `);

    const nextId =
      lastPurchase.length > 0
        ? Number(lastPurchase[0].PurchaseID) + 1
        : 1;

    const purchaseNumber =
      `PUR-${String(nextId).padStart(5, "0")}`;

    // =================================================
    // START TRANSACTION
    // =================================================

    await connection.beginTransaction();

    // =================================================
    // INSERT PURCHASE
    // =================================================

    const [purchaseResult] =
      await connection.query(
        `
        INSERT INTO purchases
        (
          PurchaseNumber,
          SupplierID,
          ManualSupplierName,
          SupplierInvoiceNumber,
          PurchaseDate,
          SubTotal,
          Discount,
          CGST,
          SGST,
          IGST,
          GSTAmount,
          GrandTotal,
          PaymentStatus,
          Notes
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          purchaseNumber,

          SupplierID
            ? Number(SupplierID)
            : null,

          String(
            ManualSupplierName || ""
          ).trim() || null,

          SupplierInvoiceNumber
            ? String(
                SupplierInvoiceNumber
              ).trim()
            : null,

          PurchaseDate,

          subTotal,

          discountAmount,

          gstAmount / 2,

          gstAmount / 2,

          0,

          gstAmount,

          grandTotal,

          PaymentStatus,

          Notes
            ? String(Notes).trim()
            : null
        ]
      );

    const purchaseId =
      purchaseResult.insertId;

    // =================================================
    // INSERT PURCHASE ITEMS
    // =================================================

    for (const item of preparedItems) {
      await connection.query(
        `
        INSERT INTO purchase_items
        (
          PurchaseID,
          ProductID,
          ManualProductName,
          Quantity,
          UnitPrice,
          GSTPercent,
          GSTAmount,
          TotalAmount
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          purchaseId,

          item.ProductID,

          item.ManualProductName,

          item.Quantity,

          item.UnitPrice,

          item.GSTPercent,

          item.GSTAmount,

          item.TotalAmount
        ]
      );

      // =================================================
      // UPDATE STOCK ONLY FOR EXISTING PRODUCT
      // =================================================

      if (item.ProductID) {
        await connection.query(
          `
          UPDATE products
          SET
            StockQuantity =
              COALESCE(StockQuantity, 0) + ?
          WHERE ProductID = ?
          `,
          [
            item.Quantity,
            item.ProductID
          ]
        );
      }
    }

    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();

    res.status(201).json({
      success: true,
      message:
        "Purchase created successfully.",

      purchaseId,

      purchaseNumber,

      totals: {
        subTotal,
        discount: discountAmount,
        gstAmount,
        grandTotal
      }
    });

  } catch (error) {

    await connection.rollback();

    console.error(
      "Create Purchase Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to create purchase.",
      error: error.message
    });

  } finally {

    connection.release();
  }
};

// =====================================================
// GET ALL PURCHASES
// GET /api/purchases
// =====================================================

export const getPurchases = async (req, res) => {
  try {

    const search =
      req.query.search || "";

    const [purchases] =
      await pool.query(
        `
        SELECT
          p.PurchaseID,
          p.PurchaseNumber,
          p.SupplierID,
          p.ManualSupplierName,
          p.SupplierInvoiceNumber,
          p.PurchaseDate,
          p.SubTotal,
          p.Discount,
          p.CGST,
          p.SGST,
          p.IGST,
          p.GSTAmount,
          p.GrandTotal,
          p.PaymentStatus,
          p.Notes,
          p.CreatedBy,
          p.CreatedAt,

          COALESCE(
            s.SupplierName,
            p.ManualSupplierName,
            'Manual Supplier'
          ) AS SupplierName,

          COALESCE(
            SUM(pi.Quantity),
            0
          ) AS ItemCount

        FROM purchases p

        LEFT JOIN suppliers s
          ON p.SupplierID = s.SupplierID

        LEFT JOIN purchase_items pi
          ON p.PurchaseID = pi.PurchaseID

        WHERE
          p.PurchaseNumber LIKE ?
          OR p.SupplierInvoiceNumber LIKE ?
          OR s.SupplierName LIKE ?
          OR p.ManualSupplierName LIKE ?

        GROUP BY
          p.PurchaseID,
          p.PurchaseNumber,
          p.SupplierID,
          p.ManualSupplierName,
          p.SupplierInvoiceNumber,
          p.PurchaseDate,
          p.SubTotal,
          p.Discount,
          p.CGST,
          p.SGST,
          p.IGST,
          p.GSTAmount,
          p.GrandTotal,
          p.PaymentStatus,
          p.Notes,
          p.CreatedBy,
          p.CreatedAt,
          s.SupplierName

        ORDER BY
          p.PurchaseID DESC
        `,
        [
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`
        ]
      );

    res.status(200).json({
      success: true,
      count: purchases.length,
      purchases
    });

  } catch (error) {

    console.error(
      "Get Purchases Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load purchases.",
      error: error.message
    });
  }
};

// =====================================================
// GET SINGLE PURCHASE
// GET /api/purchases/:id
// =====================================================

export const getPurchaseById = async (req, res) => {
  try {

    const { id } =
      req.params;

    const [purchases] =
      await pool.query(
        `
        SELECT
          p.PurchaseID,
          p.PurchaseNumber,
          p.SupplierID,
          p.ManualSupplierName,
          p.SupplierInvoiceNumber,
          p.PurchaseDate,
          p.SubTotal,
          p.Discount,
          p.CGST,
          p.SGST,
          p.IGST,
          p.GSTAmount,
          p.GrandTotal,
          p.PaymentStatus,
          p.Notes,
          p.CreatedBy,
          p.CreatedAt,

          COALESCE(
            s.SupplierName,
            p.ManualSupplierName,
            'Manual Supplier'
          ) AS SupplierName

        FROM purchases p

        LEFT JOIN suppliers s
          ON p.SupplierID = s.SupplierID

        WHERE p.PurchaseID = ?
        `,
        [id]
      );

    if (purchases.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found."
      });
    }

    res.status(200).json({
      success: true,
      purchase: purchases[0]
    });

  } catch (error) {

    console.error(
      "Get Purchase By ID Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load purchase.",
      error: error.message
    });
  }
};

// =====================================================
// GET PURCHASE ITEMS
// GET /api/purchases/:id/items
// =====================================================

export const getPurchaseItems = async (req, res) => {
  try {

    const { id } =
      req.params;

    const [items] =
      await pool.query(
        `
        SELECT
          pi.*,

          p.ProductName,
          p.ProductCode

        FROM purchase_items pi

        LEFT JOIN products p
          ON pi.ProductID = p.ProductID

        WHERE
          pi.PurchaseID = ?

        ORDER BY
          pi.PurchaseItemID ASC
        `,
        [id]
      );

    res.status(200).json({
      success: true,
      count: items.length,
      items
    });

  } catch (error) {

    console.error(
      "Get Purchase Items Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load purchase items.",
      error: error.message
    });
  }
};

// =====================================================
// DELETE PURCHASE
// DELETE /api/purchases/:id
// =====================================================

export const deletePurchase = async (req, res) => {

  const connection =
    await pool.getConnection();

  try {

    const { id } =
      req.params;

    await connection.beginTransaction();

    // =================================================
    // GET ITEMS FIRST
    // =================================================

    const [items] =
      await connection.query(
        `
        SELECT
          ProductID,
          Quantity
        FROM purchase_items
        WHERE PurchaseID = ?
        `,
        [id]
      );

    // =================================================
    // REVERSE STOCK
    // =================================================

    for (const item of items) {

      if (item.ProductID) {

        await connection.query(
          `
          UPDATE products
          SET
            StockQuantity =
              GREATEST(
                COALESCE(StockQuantity, 0) - ?,
                0
              )
          WHERE ProductID = ?
          `,
          [
            item.Quantity,
            item.ProductID
          ]
        );

      }
    }

    // =================================================
    // DELETE ITEMS
    // =================================================

    await connection.query(
      `
      DELETE FROM purchase_items
      WHERE PurchaseID = ?
      `,
      [id]
    );

    // =================================================
    // DELETE PURCHASE
    // =================================================

    const [result] =
      await connection.query(
        `
        DELETE FROM purchases
        WHERE PurchaseID = ?
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
          "Purchase not found."
      });
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message:
        "Purchase deleted successfully."
    });

  } catch (error) {

    await connection.rollback();

    console.error(
      "Delete Purchase Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete purchase.",
      error: error.message
    });

  } finally {

    connection.release();
  }
};

// =====================================================
// PURCHASE SUMMARY
// GET /api/purchases/summary
// =====================================================

export const getPurchaseSummary = async (
  req,
  res
) => {

  try {

    const [summary] =
      await pool.query(
        `
        SELECT

          COUNT(*) AS totalPurchases,

          COALESCE(
            SUM(GrandTotal),
            0
          ) AS totalAmount,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus = 'Received'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS receivedPurchases,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus = 'Pending'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS pendingPurchases

        FROM purchases
        `
      );

    res.status(200).json({
      success: true,
      summary: summary[0]
    });

  } catch (error) {

    console.error(
      "Purchase Summary Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load purchase summary.",
      error: error.message
    });
  }
};