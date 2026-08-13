import pool from "../config/db.js";

import {
  generateOrderNumber,
  generateInvoiceNumber,
  fetchCustomers,
  fetchProducts,
  fetchInvoices,
} from "../services/salesService.js";

// =====================================================
// COMPANY DETAILS
// =====================================================

const COMPANY_NAME = "Chashma Plus";

const COMPANY_ADDRESS =
  "Arjunganj, Opposite side Shyam Misthan Vatika, Lucknow, U. P., 226002";

const COMPANY_GST_NUMBER =
  "P7WKV5D77N9FTLVQX3RCKUL3";

// =====================================================
// GET SALES FORM DATA
// GET /api/sales/form-data
// =====================================================

export const getSalesFormData = async (req, res) => {
  try {
    const customers = await fetchCustomers();
    const products = await fetchProducts();

    res.status(200).json({
      success: true,

      data: {
        customers,
        products,
      },

      // Compatibility with existing frontend
      customers,
      products,
    });
  } catch (error) {
    console.error(
      "Get sales form data error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load sales form data.",
    });
  }
};

// =====================================================
// CREATE INVOICE
// POST /api/sales/create-invoice
// =====================================================

export const createInvoice = async (
  req,
  res
) => {
  let connection;

  try {
    // =================================================
    // REQUEST DATA
    // =================================================

    const {
      customerId,
      customerID,

      customerGstNumber,
      customerGSTNumber,

      billingAddress,
      shippingAddress,
      placeOfSupply,

      paymentMethod,
      paymentMode,
      paymentStatus,

      advanceAmount,
      discount,
      notes,

      items,
      products,

      createdBy,
    } = req.body;

    // =================================================
    // CUSTOMER ID
    // =================================================

    const selectedCustomerId = Number(
      customerId ??
      customerID ??
      0
    );

    if (
      !Number.isInteger(
        selectedCustomerId
      ) ||
      selectedCustomerId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid customer.",
      });
    }

    // =================================================
    // PRODUCT ITEMS
    // =================================================

    const invoiceItems =
      Array.isArray(items)
        ? items
        : Array.isArray(products)
          ? products
          : [];

    if (
      invoiceItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please add at least one product to the invoice.",
      });
    }

    // =================================================
    // PAYMENT METHOD
    // =================================================

    const finalPaymentMode =
      paymentMethod ||
      paymentMode ||
      "Cash";

    // =================================================
    // PAYMENT STATUS
    // =================================================

    const allowedPaymentStatuses = [
      "Pending",
      "Paid",
      "Partial",
    ];

    let finalPaymentStatus =
      paymentStatus ||
      "Pending";

    if (
      !allowedPaymentStatuses.includes(
        finalPaymentStatus
      )
    ) {
      finalPaymentStatus =
        "Pending";
    }

    // =================================================
    // SALE STATUS
    // =================================================

    const finalSaleStatus =
      finalPaymentStatus === "Paid"
        ? "Completed"
        : "Pending";

    // =================================================
    // DATABASE CONNECTION
    // =================================================

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    // =================================================
    // GET PRODUCT IDS
    // =================================================

    const productIds =
      invoiceItems
        .map(
          (item) =>
            Number(
              item.ProductID ??
              item.productId ??
              item.id
            )
        )
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        );

    if (
      productIds.length === 0
    ) {
      throw new Error(
        "No valid product selected."
      );
    }

    const uniqueProductIds = [
      ...new Set(productIds),
    ];

    const placeholders =
      uniqueProductIds
        .map(() => "?")
        .join(",");

    // =================================================
    // LOAD PRODUCTS FROM DATABASE
    // =================================================

    const [
      databaseProducts,
    ] =
      await connection.query(
        `
       SELECT
  p.ProductID,
  p.ProductCode,
  p.ProductName,
  p.SellingPrice,
  p.CostPrice,
  p.MRP,
  p.GSTPercent,
  p.IsActive,
  COALESCE(i.LastPurchasePrice, 0) AS InventoryPrice
FROM products p
LEFT JOIN inventory i
  ON i.ProductID = p.ProductID
WHERE p.ProductID IN (${placeholders})
        `,
        uniqueProductIds
      );

    if (
      !databaseProducts ||
      databaseProducts.length === 0
    ) {
      throw new Error(
        "Selected products were not found."
      );
    }

    // =================================================
    // PRODUCT MAP
    // =================================================

    const productMap =
      new Map();

    databaseProducts.forEach(
      (product) => {
        productMap.set(
          Number(
            product.ProductID
          ),
          product
        );
      }
    );

    // =================================================
    // CALCULATE ITEMS
    // =================================================

    const calculatedItems = [];

    let subtotal = 0;
    let totalGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    for (
      const item of invoiceItems
    ) {
      const productId =
        Number(
          item.ProductID ??
          item.productId ??
          item.id
        );

      const product =
        productMap.get(
          productId
        );

      if (!product) {
        throw new Error(
          `Product ID ${productId} was not found.`
        );
      }

      // =============================================
      // CHECK ACTIVE PRODUCT
      // =============================================

      if (
        Number(
          product.IsActive ?? 1
        ) === 0
      ) {
        throw new Error(
          `${product.ProductName} is inactive and cannot be sold.`
        );
      }

      // =============================================
      // QUANTITY
      // =============================================

      const quantity =
        Math.max(
          1,
          Number(
            item.Quantity ??
            item.quantity ??
            1
          )
        );

      if (
        !Number.isFinite(
          quantity
        )
      ) {
        throw new Error(
          `Invalid quantity for ${product.ProductName}.`
        );
      }

// =============================================
// PRICE
//
// PRICE PRIORITY:
// 1. SellingPrice
// 2. MRP
// 3. Inventory LastPurchasePrice
// =============================================

const possiblePrices = [
  product.SellingPrice,
  product.MRP,
  product.InventoryPrice,
];

const validPrice = possiblePrices.find((value) => {
  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number > 0
  );
});

const price =
  validPrice !== undefined
    ? Number(validPrice)
    : 0;

if (price <= 0) {
  throw new Error(
    `No valid selling price is configured for ${product.ProductName}. Please set a price for this product.`
  );
}

      // =============================================
      // GST
      // =============================================

      const gstApplied =
        item.applyGST === true ||
        item.gstApplied === true ||
        item.gst === true;

      const gstPercent =
        gstApplied
          ? Number(
            item.gstRate ??
            product.GSTPercent ??
            0
          )
          : 0;

      const safeGSTPercent =
        Number.isFinite(
          gstPercent
        ) &&
          gstPercent >= 0
          ? gstPercent
          : 0;

      // =============================================
      // ITEM TOTAL
      // =============================================

      const itemSubtotal =
        price * quantity;

      const itemGST =
        itemSubtotal *
        (safeGSTPercent / 100);

      const itemCGST =
        itemGST / 2;

      const itemSGST =
        itemGST / 2;

      const itemIGST = 0;

      subtotal +=
        itemSubtotal;

      totalGST +=
        itemGST;

      totalCGST +=
        itemCGST;

      totalSGST +=
        itemSGST;

      totalIGST +=
        itemIGST;

      calculatedItems.push({
        productId,

        productCode:
          product.ProductCode,

        productName:
          product.ProductName,

        quantity,

        unitPrice:
          price,

        gstPercent:
          safeGSTPercent,

        gstAmount:
          itemGST,

        totalAmount:
          itemSubtotal +
          itemGST,
      });
    }

    // =================================================
    // DISCOUNT
    // =================================================

    const discountValue =
      Number(
        discount || 0
      );

    const safeDiscount =
      Number.isFinite(
        discountValue
      )
        ? Math.min(
          Math.max(
            0,
            discountValue
          ),
          subtotal
        )
        : 0;

    // =================================================
    // TAXABLE AMOUNT
    // =================================================

    const taxableAmount =
      Math.max(
        0,
        subtotal -
        safeDiscount
      );

    // =================================================
    // GST AFTER DISCOUNT
    // =================================================

    let finalGST =
      totalGST;

    let finalCGST =
      totalCGST;

    let finalSGST =
      totalSGST;

    let finalIGST =
      totalIGST;

    if (
      safeDiscount > 0 &&
      subtotal > 0
    ) {
      const ratio =
        taxableAmount /
        subtotal;

      finalGST =
        totalGST *
        ratio;

      finalCGST =
        totalCGST *
        ratio;

      finalSGST =
        totalSGST *
        ratio;

      finalIGST =
        totalIGST *
        ratio;
    }

    // =================================================
    // GRAND TOTAL
    // =================================================

    const grandTotal =
      Number(
        (
          taxableAmount +
          finalGST
        ).toFixed(2)
      );

    if (
      grandTotal <= 0
    ) {
      throw new Error(
        "Invoice total must be greater than zero."
      );
    }

    // =================================================
    // ADVANCE
    // =================================================

    let finalAdvance =
      Number(
        advanceAmount || 0
      );

    if (
      !Number.isFinite(
        finalAdvance
      )
    ) {
      finalAdvance = 0;
    }

    if (
      finalPaymentStatus ===
      "Paid"
    ) {
      finalAdvance =
        grandTotal;
    }

    finalAdvance =
      Math.min(
        Math.max(
          0,
          finalAdvance
        ),
        grandTotal
      );

    finalAdvance =
      Number(
        finalAdvance.toFixed(2)
      );

    // =================================================
    // BALANCE
    // =================================================

    const balanceAmount =
      Number(
        (
          grandTotal -
          finalAdvance
        ).toFixed(2)
      );

    // =================================================
    // GENERATE ORDER NUMBER
    // =================================================

    const orderNumber =
      await generateOrderNumber(
        connection
      );

    // =================================================
    // GENERATE INVOICE NUMBER
    // =================================================

    const invoiceNumber =
      await generateInvoiceNumber(
        connection
      );

    // =================================================
    // IMPORTANT:
    // CREATE SALE FIRST
    // =================================================

    const [
      saleResult,
    ] =
      await connection.query(
        `
        INSERT INTO sales
        (
          InvoiceNumber,
          CustomerID,
          SaleDate,
          SubTotal,
          Discount,
          CGST,
          SGST,
          IGST,
          GSTAmount,
          RoundOff,
          GrandTotal,
          PaymentStatus,
          SaleStatus,
          Notes,
          CreatedBy
        )
        VALUES
        (
          ?,
          ?,
          NOW(),
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
          ?,
          ?
        )
        `,
        [
          invoiceNumber,

          selectedCustomerId,

          Number(
            subtotal.toFixed(2)
          ),

          Number(
            safeDiscount.toFixed(2)
          ),

          Number(
            finalCGST.toFixed(2)
          ),

          Number(
            finalSGST.toFixed(2)
          ),

          Number(
            finalIGST.toFixed(2)
          ),

          Number(
            finalGST.toFixed(2)
          ),

          0,

          grandTotal,

          finalPaymentStatus,

          finalSaleStatus,

          notes ||
          "Sale created from Sales & Billing",

          createdBy ||
          null,
        ]
      );

    // =================================================
    // SALE ID
    // =================================================

    const saleId =
      Number(
        saleResult.insertId
      );

    if (
      !Number.isInteger(
        saleId
      ) ||
      saleId <= 0
    ) {
      throw new Error(
        "Sale was not created correctly. Invalid SaleID returned by MySQL."
      );
    }

    // =================================================
    // VERIFY SALE EXISTS
    // =================================================

    const [
      saleCheck,
    ] =
      await connection.query(
        `
        SELECT SaleID
        FROM sales
        WHERE SaleID = ?
        LIMIT 1
        `,
        [saleId]
      );

    if (
      !saleCheck ||
      saleCheck.length === 0
    ) {
      throw new Error(
        `SaleID ${saleId} was not found immediately after creation.`
      );
    }

    // =================================================
    // CREATE INVOICE
    // =================================================

    await connection.query(
      `
      INSERT INTO invoices
      (
        SaleID,
        InvoiceNumber,
        InvoiceDate,
        CompanyName,
        CompanyAddress,
        CompanyGSTNumber,
        CustomerGSTNumber,
        BillingAddress,
        ShippingAddress,
        PlaceOfSupply,
        TotalTaxableAmount,
        CGST,
        SGST,
        IGST,
        TotalGST,
        GrandTotal,
        PaymentMode
      )
      VALUES
      (
        ?,
        ?,
        NOW(),
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
        ?,
        ?,
        ?,
        ?
      )
      `,
      [
        saleId,

        invoiceNumber,

        COMPANY_NAME,

        COMPANY_ADDRESS,

        COMPANY_GST_NUMBER,

        customerGstNumber ||
        customerGSTNumber ||
        null,

        billingAddress ||
        null,

        shippingAddress ||
        null,

        placeOfSupply ||
        "Uttar Pradesh",

        Number(
          taxableAmount.toFixed(2)
        ),

        Number(
          finalCGST.toFixed(2)
        ),

        Number(
          finalSGST.toFixed(2)
        ),

        Number(
          finalIGST.toFixed(2)
        ),

        Number(
          finalGST.toFixed(2)
        ),

        grandTotal,

        finalPaymentMode,
      ]
    );

    // =================================================
    // CREATE ORDER
    // =================================================

    const [
      orderResult,
    ] =
      await connection.query(
        `
        INSERT INTO orders
        (
          OrderNumber,
          CustomerID,
          OrderDate,
          OrderType,
          Status,
          TotalAmount,
          AdvanceAmount,
          BalanceAmount,
          Notes,
          CreatedBy
        )
        VALUES
        (
          ?,
          ?,
          NOW(),
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
          orderNumber,

          selectedCustomerId,

          "Complete Glasses",

          finalSaleStatus,

          grandTotal,

          finalAdvance,

          balanceAmount,

          notes ||
          "Order created from Sales & Billing",

          createdBy ||
          null,
        ]
      );

    const orderId =
      Number(
        orderResult.insertId
      );

    if (
      !Number.isInteger(
        orderId
      ) ||
      orderId <= 0
    ) {
      throw new Error(
        "Order was not created correctly."
      );
    }

    // =================================================
    // CREATE ORDER ITEMS
    // =================================================

    for (
      const item of calculatedItems
    ) {
      await connection.query(
        `
        INSERT INTO order_items
        (
          OrderID,
          ProductID,
          Quantity,
          UnitPrice,
          TotalAmount
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          orderId,

          item.productId,

          item.quantity,

          item.unitPrice,

          Number(
            item.totalAmount.toFixed(2)
          ),
        ]
      );
    }

    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();

    // =================================================
    // SUCCESS RESPONSE
    // =================================================

    res.status(201).json({
      success: true,

      message:
        "Invoice created successfully.",

      invoiceNumber,

      data: {
        saleId,

        orderId,

        invoiceNumber,

        orderNumber,

        customerId:
          selectedCustomerId,

        subtotal:
          Number(
            subtotal.toFixed(2)
          ),

        discount:
          Number(
            safeDiscount.toFixed(2)
          ),

        taxableAmount:
          Number(
            taxableAmount.toFixed(2)
          ),

        cgst:
          Number(
            finalCGST.toFixed(2)
          ),

        sgst:
          Number(
            finalSGST.toFixed(2)
          ),

        igst:
          Number(
            finalIGST.toFixed(2)
          ),

        gst:
          Number(
            finalGST.toFixed(2)
          ),

        grandTotal,

        advanceAmount:
          finalAdvance,

        balanceAmount,

        paymentMode:
          finalPaymentMode,

        paymentStatus:
          finalPaymentStatus,

        saleStatus:
          finalSaleStatus,

        company: {
          name:
            COMPANY_NAME,

          address:
            COMPANY_ADDRESS,

          gstNumber:
            COMPANY_GST_NUMBER,
        },

        items:
          calculatedItems,
      },
    });
  } catch (error) {
    // =================================================
    // ROLLBACK
    // =================================================

    if (connection) {
      try {
        await connection.rollback();
      } catch (
      rollbackError
      ) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    // =================================================
    // LOG ERROR
    // =================================================

    console.error(
      "CREATE INVOICE ERROR:",
      error
    );

    // =================================================
    // FRIENDLY ERROR
    // =================================================

    let message =
      error.message ||
      "Failed to create invoice.";

    if (
      error.code ===
      "ER_NO_REFERENCED_ROW_2"
    ) {
      message =
        "Invoice could not be created because a required customer, product or sale reference was not found.";
    }

    if (
      error.code ===
      "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD"
    ) {
      message =
        `Invalid value for database field: ${error.sqlMessage ||
        error.message
        }`;
    }

    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {
      message =
        "Duplicate invoice/order number. Please try again.";
    }

    res.status(500).json({
      success: false,
      message,
    });
  } finally {
    // =================================================
    // RELEASE CONNECTION
    // =================================================

    if (connection) {
      connection.release();
    }
  }
};

// =====================================================
// GET INVOICE HISTORY
// GET /api/sales/invoices
// =====================================================

export const getInvoiceHistory =
  async (
    req,
    res
  ) => {
    try {
      const invoices =
        await fetchInvoices();

      res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      console.error(
        "Get invoice history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load invoice history.",
      });
    }
  };