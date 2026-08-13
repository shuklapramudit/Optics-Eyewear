import pool from "../config/db.js";

// =====================================================
// GET ALL CUSTOMERS
// GET /api/customers
// =====================================================

export const getCustomers = async (req, res) => {
  try {
    const search =
      String(
        req.query.search || ""
      ).trim();

    const value =
      `%${search}%`;

    const [customers] =
      await pool.query(
        `
        SELECT
          c.CustomerID,
          c.CustomerCode,
          c.FullName,
          c.Phone,
          c.Email,
          c.Address,
          c.City,
          c.State,
          c.Pincode,
          c.GSTNumber,
          c.DateOfBirth,
          c.Gender,
          c.Notes,
          c.CreatedAt,
          c.UpdatedAt,

          COUNT(
            DISTINCT o.OrderID
          ) AS Purchases,

          COALESCE(
            SUM(o.TotalAmount),
            0
          ) AS TotalSpent

        FROM customers c

        LEFT JOIN orders o
          ON o.CustomerID =
             c.CustomerID

        WHERE
          c.FullName LIKE ?
          OR c.Phone LIKE ?
          OR COALESCE(
               c.CustomerCode,
               ''
             ) LIKE ?
          OR COALESCE(
               c.Gender,
               ''
             ) LIKE ?

        GROUP BY
          c.CustomerID,
          c.CustomerCode,
          c.FullName,
          c.Phone,
          c.Email,
          c.Address,
          c.City,
          c.State,
          c.Pincode,
          c.GSTNumber,
          c.DateOfBirth,
          c.Gender,
          c.Notes,
          c.CreatedAt,
          c.UpdatedAt

        ORDER BY
          c.CustomerID DESC
        `,
        [
          value,
          value,
          value,
          value,
        ]
      );

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error(
      "Get Customers Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load customers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET CUSTOMER SUMMARY
// GET /api/customers/summary
// =====================================================

export const getCustomerSummary =
  async (req, res) => {
    try {
      const [
        [customerSummary],
      ] = await pool.query(
        `
        SELECT
          COUNT(*) AS totalCustomers
        FROM customers
        `
      );

      const [
        [activeSummary],
      ] = await pool.query(
        `
        SELECT
          COUNT(
            DISTINCT CustomerID
          ) AS activeCustomers

        FROM orders

        WHERE CustomerID IS NOT NULL
        `
      );

      let eyeTests = 0;

      const [
        eyeTestTables,
      ] = await pool.query(
        `
        SHOW TABLES
        LIKE 'eye_tests'
        `
      );

      if (
        eyeTestTables.length >
        0
      ) {
        const [
          [eyeTestSummary],
        ] = await pool.query(
          `
          SELECT
            COUNT(*) AS eyeTests
          FROM eye_tests
          `
        );

        eyeTests =
          Number(
            eyeTestSummary
              ?.eyeTests || 0
          );
      }

      res.status(200).json({
        success: true,

        summary: {
          totalCustomers:
            Number(
              customerSummary
                ?.totalCustomers ||
                0
            ),

          activeCustomers:
            Number(
              activeSummary
                ?.activeCustomers ||
                0
            ),

          eyeTests:
            Number(
              eyeTests || 0
            ),
        },
      });
    } catch (error) {
      console.error(
        "Get Customer Summary Error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load customer summary.",
        error: error.message,
      });
    }
  };

// =====================================================
// GET SINGLE CUSTOMER
// GET /api/customers/:id
// =====================================================

export const getCustomerById =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID.",
        });
      }

      const [customers] =
        await pool.query(
          `
          SELECT
            CustomerID,
            CustomerCode,
            FullName,
            Phone,
            Email,
            Address,
            City,
            State,
            Pincode,
            GSTNumber,
            DateOfBirth,
            Gender,
            Notes,
            CreatedAt,
            UpdatedAt

          FROM customers

          WHERE CustomerID = ?

          LIMIT 1
          `,
          [id]
        );

      if (
        customers.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      const customer =
        customers[0];

      // =================================================
      // PURCHASED ITEMS
      // =================================================

      const [
        purchasedItems,
      ] = await pool.query(
        `
        SELECT
          oi.OrderItemID,
          oi.OrderID,
          oi.ProductID,
          oi.Quantity,
          oi.UnitPrice,
          oi.TotalAmount,

          p.ProductCode,
          p.ProductName,

          o.OrderNumber,
          o.OrderDate

        FROM orders o

        INNER JOIN order_items oi
          ON oi.OrderID =
             o.OrderID

        LEFT JOIN products p
          ON p.ProductID =
             oi.ProductID

        WHERE o.CustomerID = ?

        ORDER BY
          o.OrderDate DESC,
          oi.OrderItemID DESC
        `,
        [id]
      );

      // =================================================
      // ORDERS
      // =================================================

      const [orders] =
        await pool.query(
          `
          SELECT
            OrderID,
            OrderNumber,
            CustomerID,
            OrderDate,
            OrderType,
            Status,
            TotalAmount,
            AdvanceAmount,
            BalanceAmount,
            Notes,
            CreatedBy,
            CreatedAt

          FROM orders

          WHERE CustomerID = ?

          ORDER BY
            OrderDate DESC,
            OrderID DESC
          `,
          [id]
        );

      // =================================================
      // CUSTOMER SPENDING
      // =================================================

      const [
        [spentResult],
      ] = await pool.query(
        `
        SELECT

          COALESCE(
            SUM(TotalAmount),
            0
          ) AS TotalSpent,

          COUNT(*) AS Purchases

        FROM orders

        WHERE CustomerID = ?
        `,
        [id]
      );

      // =================================================
      // EYE TESTS
      // =================================================

      let eyeTests = [];

      const [
        eyeTestTables,
      ] = await pool.query(
        `
        SHOW TABLES
        LIKE 'eye_tests'
        `
      );

      if (
        eyeTestTables.length >
        0
      ) {
        try {
          const [tests] =
            await pool.query(
              `
              SELECT *
              FROM eye_tests

              WHERE CustomerID = ?

              ORDER BY
                TestDate DESC,
                EyeTestID DESC
              `,
              [id]
            );

          eyeTests = tests;
        } catch (
          eyeTestError
        ) {
          console.warn(
            "Eye test data could not be loaded:",
            eyeTestError.message
          );

          eyeTests = [];
        }
      }

      res.status(200).json({
        success: true,

        customer,

        purchasedItems,

        orders,

        eyeTests,

        Purchases:
          Number(
            spentResult
              ?.Purchases || 0
          ),

        TotalSpent:
          Number(
            spentResult
              ?.TotalSpent || 0
          ),
      });
    } catch (error) {
      console.error(
        "Get Customer By ID Error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load customer.",
        error: error.message,
      });
    }
  };

// =====================================================
// CREATE CUSTOMER
// POST /api/customers
//
// REQUIRED:
// FullName
// Phone
// Gender
//
// CustomerCode AUTO GENERATED
// =====================================================

export const createCustomer =
  async (req, res) => {
    try {
      const FullName =
        String(
          req.body.FullName ||
            ""
        ).trim();

      const Phone =
        String(
          req.body.Phone ||
            ""
        ).trim();

      const Gender =
        String(
          req.body.Gender ||
            ""
        ).trim();

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !FullName ||
        !Phone ||
        !Gender
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full Name, Phone and Gender are required.",
        });
      }

      const allowedGenders =
        [
          "Male",
          "Female",
          "Other",
        ];

      if (
        !allowedGenders.includes(
          Gender
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a valid gender.",
        });
      }

      // =================================================
      // INSERT CUSTOMER
      //
      // CustomerCode is intentionally not accepted
      // from frontend.
      // =================================================

      const [result] =
        await pool.query(
          `
          INSERT INTO customers
          (
            FullName,
            Phone,
            Gender
          )

          VALUES
          (
            ?,
            ?,
            ?
          )
          `,
          [
            FullName,
            Phone,
            Gender,
          ]
        );

      const customerId =
        Number(
          result.insertId
        );

      // =================================================
      // AUTO CUSTOMER CODE
      // Example:
      // CUS-00001
      // CUS-00002
      // =================================================

      const customerCode =
        `CUS-${String(
          customerId
        ).padStart(
          5,
          "0"
        )}`;

      await pool.query(
        `
        UPDATE customers

        SET CustomerCode = ?

        WHERE CustomerID = ?
        `,
        [
          customerCode,
          customerId,
        ]
      );

      res.status(201).json({
        success: true,

        message:
          "Customer added successfully.",

        customerId,

        customerCode,
      });
    } catch (error) {
      console.error(
        "Create Customer Error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to create customer.",
        error: error.message,
      });
    }
  };

// =====================================================
// UPDATE CUSTOMER
// PUT /api/customers/:id
//
// CustomerCode NEVER changes.
// =====================================================

export const updateCustomer =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const FullName =
        String(
          req.body.FullName ||
            ""
        ).trim();

      const Phone =
        String(
          req.body.Phone ||
            ""
        ).trim();

      const Gender =
        String(
          req.body.Gender ||
            ""
        ).trim();

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID.",
        });
      }

      if (
        !FullName ||
        !Phone ||
        !Gender
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full Name, Phone and Gender are required.",
        });
      }

      const allowedGenders =
        [
          "Male",
          "Female",
          "Other",
        ];

      if (
        !allowedGenders.includes(
          Gender
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a valid gender.",
        });
      }

      const [result] =
        await pool.query(
          `
          UPDATE customers

          SET
            FullName = ?,
            Phone = ?,
            Gender = ?

          WHERE CustomerID = ?
          `,
          [
            FullName,
            Phone,
            Gender,
            id,
          ]
        );

      if (
        result.affectedRows ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      const [
        [updatedCustomer],
      ] = await pool.query(
        `
        SELECT
          CustomerID,
          CustomerCode,
          FullName,
          Phone,
          Gender

        FROM customers

        WHERE CustomerID = ?

        LIMIT 1
        `,
        [id]
      );

      res.status(200).json({
        success: true,

        message:
          "Customer updated successfully.",

        customer:
          updatedCustomer ||
          null,
      });
    } catch (error) {
      console.error(
        "Update Customer Error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update customer.",
        error: error.message,
      });
    }
  };

// =====================================================
// DELETE CUSTOMER
// DELETE /api/customers/:id
// =====================================================

export const deleteCustomer =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID.",
        });
      }

      // =================================================
      // ORDER CHECK
      // Orders use ON DELETE RESTRICT.
      // =================================================

      const [
        [orderCheck],
      ] = await pool.query(
        `
        SELECT
          COUNT(*) AS total

        FROM orders

        WHERE CustomerID = ?
        `,
        [id]
      );

      if (
        Number(
          orderCheck?.total ||
            0
        ) > 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This customer has existing orders and cannot be deleted. Please keep the customer record for purchase history.",
        });
      }

      const [result] =
        await pool.query(
          `
          DELETE FROM customers

          WHERE CustomerID = ?
          `,
          [id]
        );

      if (
        result.affectedRows ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      res.status(200).json({
        success: true,

        message:
          "Customer deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Customer Error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete customer.",
        error: error.message,
      });
    }
  };