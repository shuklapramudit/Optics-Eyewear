import pool from "../config/db.js";

// =====================================================
// GET ALL ORDERS
// GET /api/orders
// =====================================================

export const getOrders = async (req, res) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    let query = `
      SELECT
        o.*,
        c.FullName AS CustomerName,
        c.Phone AS CustomerPhone
      FROM orders o
      LEFT JOIN customers c
        ON c.CustomerID = o.CustomerID
    `;

    const params = [];

    if (search) {
      query += `
        WHERE
          o.OrderNumber LIKE ?
          OR c.FullName LIKE ?
          OR c.Phone LIKE ?
          OR o.Status LIKE ?
      `;

      const value = `%${search}%`;

      params.push(
        value,
        value,
        value,
        value
      );
    }

    query += `
      ORDER BY
        o.OrderID DESC
    `;

    const [orders] =
      await pool.query(
        query,
        params
      );

    res.status(200).json({
      success: true,
      message:
        "Orders loaded successfully.",
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get Orders Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load orders.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ORDER FORM DATA
// GET /api/orders/form-data
// =====================================================

export const getOrderFormData =
  async (req, res) => {
    try {
      // -----------------------------------------------
      // CUSTOMERS
      // -----------------------------------------------

      const [customers] =
        await pool.query(`
          SELECT
            CustomerID,
            FullName,
            Phone,
            Email
          FROM customers
          ORDER BY FullName ASC
        `);

      // -----------------------------------------------
      // PRODUCTS
      //
      // SELECT * intentionally used here because the
      // existing Products table contains project-specific
      // columns.
      // -----------------------------------------------

      const [products] =
        await pool.query(`
          SELECT *
          FROM products
          ORDER BY ProductID DESC
        `);

      res.status(200).json({
        success: true,
        message:
          "Order form data loaded successfully.",
        customers,
        products,
      });
    } catch (error) {
      console.error(
        "Get Order Form Data Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load order form data.",
        error: error.message,
      });
    }
  };

// =====================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// =====================================================

export const getOrderById =
  async (req, res) => {
    try {
      const orderId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          orderId
        ) ||
        orderId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID.",
        });
      }

      // -----------------------------------------------
      // ORDER
      // -----------------------------------------------

      const [orders] =
        await pool.query(
          `
          SELECT
            o.*,
            c.FullName AS CustomerName,
            c.Phone AS CustomerPhone,
            c.Email AS CustomerEmail
          FROM orders o
          LEFT JOIN customers c
            ON c.CustomerID = o.CustomerID
          WHERE o.OrderID = ?
          LIMIT 1
          `,
          [orderId]
        );

      if (
        orders.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      const order =
        orders[0];

      // -----------------------------------------------
      // ORDER ITEMS
      // -----------------------------------------------

      const [items] =
        await pool.query(
          `
          SELECT
            oi.*,
            p.ProductName
          FROM order_items oi
          LEFT JOIN products p
            ON p.ProductID = oi.ProductID
          WHERE oi.OrderID = ?
          ORDER BY oi.OrderItemID ASC
          `,
          [orderId]
        );

      order.items = items;

      res.status(200).json({
        success: true,
        message:
          "Order loaded successfully.",
        order,
      });
    } catch (error) {
      console.error(
        "Get Order Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load order.",
        error: error.message,
      });
    }
  };

// =====================================================
// GENERATE ORDER NUMBER
// =====================================================

const generateOrderNumber =
  async (connection) => {
    const [rows] =
      await connection.query(`
        SELECT OrderID
        FROM orders
        ORDER BY OrderID DESC
        LIMIT 1
      `);

    const lastId =
      rows.length > 0
        ? Number(
            rows[0].OrderID
          )
        : 0;

    const nextId =
      lastId + 1;

    return `ORD-${String(
      nextId
    ).padStart(5, "0")}`;
  };

// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

export const createOrder =
  async (req, res) => {
    let connection = null;

    try {
      const {
        CustomerID,
        OrderType,
        Status,
        TotalAmount,
        AdvanceAmount,
        Notes,
        CreatedBy,
        items,
      } = req.body;

      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (!CustomerID) {
        return res.status(400).json({
          success: false,
          message:
            "Customer is required.",
        });
      }

      const total =
        Number(
          TotalAmount
        );

      const advance =
        Number(
          AdvanceAmount || 0
        );

      if (
        !Number.isFinite(total) ||
        total <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Total amount must be greater than zero.",
        });
      }

      if (
        !Number.isFinite(
          advance
        ) ||
        advance < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid advance amount.",
        });
      }

      if (
        advance > total
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Advance amount cannot be greater than total amount.",
        });
      }

      // -----------------------------------------------
      // VERIFY CUSTOMER
      // -----------------------------------------------

      const [
        customerRows,
      ] = await pool.query(
        `
        SELECT CustomerID
        FROM customers
        WHERE CustomerID = ?
        LIMIT 1
        `,
        [Number(CustomerID)]
      );

      if (
        customerRows.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected customer does not exist.",
        });
      }

      // -----------------------------------------------
      // TRANSACTION
      // -----------------------------------------------

      connection =
        await pool.getConnection();

      await connection.beginTransaction();

      // -----------------------------------------------
      // ORDER NUMBER
      // -----------------------------------------------

      const orderNumber =
        await generateOrderNumber(
          connection
        );

      // -----------------------------------------------
      // BALANCE
      // -----------------------------------------------

      const balance =
        Number(
          (
            total -
            advance
          ).toFixed(2)
        );

      // -----------------------------------------------
      // STATUS
      // -----------------------------------------------

      const orderStatus =
        Status ||
        "Pending";

      // -----------------------------------------------
      // CREATE ORDER
      // -----------------------------------------------

      const [
        orderResult,
      ] = await connection.query(
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

          Number(
            CustomerID
          ),

          OrderType ||
            "Complete Glasses",

          orderStatus,

          total,

          advance,

          balance,

          Notes ||
            null,

          CreatedBy ||
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

      // -----------------------------------------------
      // CREATE ORDER ITEMS
      //
      // Supported payload:
      //
      // items: [
      //   {
      //     ProductID,
      //     Quantity,
      //     UnitPrice,
      //     TotalAmount
      //   }
      // ]
      // -----------------------------------------------

      if (
        Array.isArray(items) &&
        items.length > 0
      ) {
        for (
          const item of items
        ) {
          const productId =
            Number(
              item.ProductID
            );

          const quantity =
            Number(
              item.Quantity
            );

          const unitPrice =
            Number(
              item.UnitPrice
            );

          const itemTotal =
            Number(
              item.TotalAmount ??
                quantity *
                  unitPrice
            );

          if (
            !Number.isInteger(
              productId
            ) ||
            productId <= 0
          ) {
            throw new Error(
              "Invalid product ID in order items."
            );
          }

          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity <= 0
          ) {
            throw new Error(
              "Invalid product quantity."
            );
          }

          if (
            !Number.isFinite(
              unitPrice
            ) ||
            unitPrice < 0
          ) {
            throw new Error(
              "Invalid product price."
            );
          }

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

              productId,

              quantity,

              unitPrice,

              Number(
                itemTotal.toFixed(
                  2
                )
              ),
            ]
          );
        }
      }

      // -----------------------------------------------
      // COMMIT
      // -----------------------------------------------

      await connection.commit();

      // -----------------------------------------------
      // GET CREATED ORDER
      // -----------------------------------------------

      const [
        createdOrders,
      ] = await pool.query(
        `
        SELECT
          o.*,
          c.FullName AS CustomerName,
          c.Phone AS CustomerPhone
        FROM orders o
        LEFT JOIN customers c
          ON c.CustomerID = o.CustomerID
        WHERE o.OrderID = ?
        LIMIT 1
        `,
        [orderId]
      );

      res.status(201).json({
        success: true,
        message:
          "Order created successfully.",
        orderNumber,
        order:
          createdOrders[0] ||
          null,
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (
          rollbackError
        ) {
          console.error(
            "Order rollback error:",
            rollbackError
          );
        }
      }

      console.error(
        "Create Order Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to create order.",
        error: error.message,
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };

// =====================================================
// UPDATE ORDER
// PUT /api/orders/:id
// =====================================================

export const updateOrder =
  async (req, res) => {
    try {
      const orderId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          orderId
        ) ||
        orderId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID.",
        });
      }

      const {
        CustomerID,
        OrderType,
        Status,
        TotalAmount,
        AdvanceAmount,
        Notes,
      } = req.body;

      if (!CustomerID) {
        return res.status(400).json({
          success: false,
          message:
            "Customer is required.",
        });
      }

      const total =
        Number(
          TotalAmount
        );

      const advance =
        Number(
          AdvanceAmount || 0
        );

      if (
        !Number.isFinite(total) ||
        total <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Total amount must be greater than zero.",
        });
      }

      if (
        advance < 0 ||
        advance > total
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid advance amount.",
        });
      }

      // -----------------------------------------------
      // VERIFY ORDER
      // -----------------------------------------------

      const [
        existingOrder,
      ] = await pool.query(
        `
        SELECT OrderID
        FROM orders
        WHERE OrderID = ?
        LIMIT 1
        `,
        [orderId]
      );

      if (
        existingOrder.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      // -----------------------------------------------
      // VERIFY CUSTOMER
      // -----------------------------------------------

      const [
        customerRows,
      ] = await pool.query(
        `
        SELECT CustomerID
        FROM customers
        WHERE CustomerID = ?
        LIMIT 1
        `,
        [Number(CustomerID)]
      );

      if (
        customerRows.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected customer does not exist.",
        });
      }

      // -----------------------------------------------
      // BALANCE
      // -----------------------------------------------

      const balance =
        Number(
          (
            total -
            advance
          ).toFixed(2)
        );

      // -----------------------------------------------
      // UPDATE
      // -----------------------------------------------

      await pool.query(
        `
        UPDATE orders
        SET
          CustomerID = ?,
          OrderType = ?,
          Status = ?,
          TotalAmount = ?,
          AdvanceAmount = ?,
          BalanceAmount = ?,
          Notes = ?
        WHERE OrderID = ?
        `,
        [
          Number(
            CustomerID
          ),

          OrderType ||
            "Complete Glasses",

          Status ||
            "Pending",

          total,

          advance,

          balance,

          Notes ||
            null,

          orderId,
        ]
      );

      // -----------------------------------------------
      // GET UPDATED ORDER
      // -----------------------------------------------

      const [
        updatedOrders,
      ] = await pool.query(
        `
        SELECT
          o.*,
          c.FullName AS CustomerName,
          c.Phone AS CustomerPhone
        FROM orders o
        LEFT JOIN customers c
          ON c.CustomerID = o.CustomerID
        WHERE o.OrderID = ?
        LIMIT 1
        `,
        [orderId]
      );

      res.status(200).json({
        success: true,
        message:
          "Order updated successfully.",
        order:
          updatedOrders[0] ||
          null,
      });
    } catch (error) {
      console.error(
        "Update Order Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update order.",
        error: error.message,
      });
    }
  };

// =====================================================
// DELETE ORDER
// DELETE /api/orders/:id
// =====================================================

export const deleteOrder =
  async (req, res) => {
    let connection = null;

    try {
      const orderId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          orderId
        ) ||
        orderId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID.",
        });
      }

      // -----------------------------------------------
      // TRANSACTION
      // -----------------------------------------------

      connection =
        await pool.getConnection();

      await connection.beginTransaction();

      // -----------------------------------------------
      // VERIFY
      // -----------------------------------------------

      const [
        orders,
      ] = await connection.query(
        `
        SELECT OrderID
        FROM orders
        WHERE OrderID = ?
        LIMIT 1
        `,
        [orderId]
      );

      if (
        orders.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      // -----------------------------------------------
      // DELETE ITEMS FIRST
      // -----------------------------------------------

      await connection.query(
        `
        DELETE FROM order_items
        WHERE OrderID = ?
        `,
        [orderId]
      );

      // -----------------------------------------------
      // DELETE ORDER
      // -----------------------------------------------

      await connection.query(
        `
        DELETE FROM orders
        WHERE OrderID = ?
        `,
        [orderId]
      );

      // -----------------------------------------------
      // COMMIT
      // -----------------------------------------------

      await connection.commit();

      res.status(200).json({
        success: true,
        message:
          "Order deleted successfully.",
        orderId,
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (
          rollbackError
        ) {
          console.error(
            "Delete rollback error:",
            rollbackError
          );
        }
      }

      console.error(
        "Delete Order Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete order.",
        error: error.message,
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };