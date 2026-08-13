import pool from "../config/db.js";

// =====================================================
// GET PAYMENTS
// GET /api/payments
// =====================================================

export const getPayments = async (req, res) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const status = String(
      req.query.status || ""
    ).trim();

    let query = `
      SELECT
        p.*,

        s.InvoiceNumber,

        s.SaleDate,

        COALESCE(
          c.FullName,
          'Walk-in Customer'
        ) AS CustomerName,

        c.Phone AS CustomerPhone

      FROM payments p

      LEFT JOIN sales s
        ON s.SaleID = p.SaleID

      LEFT JOIN customers c
        ON c.CustomerID = p.CustomerID

      WHERE 1 = 1
    `;

    const params = [];

    // =================================================
    // SEARCH
    // =================================================

    if (search) {
      query += `
        AND (
          p.PaymentMode LIKE ?
          OR p.PaymentType LIKE ?
          OR p.Notes LIKE ?
          OR s.InvoiceNumber LIKE ?
          OR c.FullName LIKE ?
          OR c.Phone LIKE ?
        )
      `;

      const value = `%${search}%`;

      params.push(
        value,
        value,
        value,
        value,
        value,
        value
      );
    }

    // =================================================
    // PAYMENT TYPE FILTER
    // =================================================

    if (status) {
      query += `
        AND p.PaymentType = ?
      `;

      params.push(status);
    }

    // =================================================
    // ORDER
    // =================================================

    query += `
      ORDER BY
        p.PaymentID DESC
    `;

    const [payments] =
      await pool.query(
        query,
        params
      );

    // =================================================
    // SUMMARY
    // =================================================

    const [summaryRows] =
      await pool.query(`
        SELECT

          COUNT(*) AS totalPayments,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentType = 'Received'
                THEN Amount
                ELSE 0
              END
            ),
            0
          ) AS totalReceived,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentType = 'Refund'
                THEN Amount
                ELSE 0
              END
            ),
            0
          ) AS totalRefund,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentType = 'Received'
                THEN Amount
                WHEN PaymentType = 'Refund'
                THEN -Amount
                ELSE 0
              END
            ),
            0
          ) AS netAmount

        FROM payments
      `);

    res.status(200).json({
      success: true,

      payments,

      summary: {
        totalPayments: Number(
          summaryRows[0]?.totalPayments || 0
        ),

        totalReceived: Number(
          summaryRows[0]?.totalReceived || 0
        ),

        totalRefund: Number(
          summaryRows[0]?.totalRefund || 0
        ),

        netAmount: Number(
          summaryRows[0]?.netAmount || 0
        )
      }
    });

  } catch (error) {

    console.error(
      "Get Payments Error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Unable to load payments.",

      error:
        error.message
    });
  }
};


// =====================================================
// PAYMENT SUMMARY
// GET /api/payments/summary
// =====================================================

export const getPaymentSummary =
  async (req, res) => {

    try {

      const [summary] =
        await pool.query(`
          SELECT

            COUNT(*) AS totalPayments,

            COALESCE(
              SUM(
                CASE
                  WHEN PaymentType = 'Received'
                  THEN Amount
                  ELSE 0
                END
              ),
              0
            ) AS totalReceived,

            COALESCE(
              SUM(
                CASE
                  WHEN PaymentType = 'Refund'
                  THEN Amount
                  ELSE 0
                END
              ),
              0
            ) AS totalRefund,

            COALESCE(
              SUM(
                CASE
                  WHEN PaymentType = 'Received'
                  THEN Amount

                  WHEN PaymentType = 'Refund'
                  THEN -Amount

                  ELSE 0
                END
              ),
              0
            ) AS netAmount

          FROM payments
        `);

      // =================================================
      // PAYMENT MODE BREAKDOWN
      // =================================================

      const [modeBreakdown] =
        await pool.query(`
          SELECT

            PaymentMode,

            COUNT(*) AS transactionCount,

            COALESCE(
              SUM(Amount),
              0
            ) AS amount

          FROM payments

          WHERE PaymentType = 'Received'

          GROUP BY PaymentMode

          ORDER BY amount DESC
        `);

      res.status(200).json({

        success: true,

        summary: {

          totalPayments:
            Number(
              summary[0]?.totalPayments || 0
            ),

          totalReceived:
            Number(
              summary[0]?.totalReceived || 0
            ),

          totalRefund:
            Number(
              summary[0]?.totalRefund || 0
            ),

          netAmount:
            Number(
              summary[0]?.netAmount || 0
            )
        },

        modeBreakdown

      });

    } catch (error) {

      console.error(
        "Payment Summary Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load payment summary.",

        error:
          error.message

      });

    }
  };


// =====================================================
// GET SINGLE PAYMENT
// GET /api/payments/:id
// =====================================================

export const getPaymentById =
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
            "Invalid payment ID."

        });

      }

      const [rows] =
        await pool.query(`
          SELECT

            p.*,

            s.InvoiceNumber,

            s.SaleDate,

            s.GrandTotal,

            s.PaymentStatus,

            COALESCE(
              c.FullName,
              'Walk-in Customer'
            ) AS CustomerName,

            c.Phone AS CustomerPhone,

            c.Email AS CustomerEmail

          FROM payments p

          LEFT JOIN sales s
            ON s.SaleID = p.SaleID

          LEFT JOIN customers c
            ON c.CustomerID = p.CustomerID

          WHERE p.PaymentID = ?

          LIMIT 1
        `, [id]);

      if (
        rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Payment not found."

        });

      }

      res.status(200).json({

        success: true,

        payment:
          rows[0]

      });

    } catch (error) {

      console.error(
        "Get Payment Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load payment.",

        error:
          error.message

      });

    }
  };


// =====================================================
// CREATE PAYMENT
// POST /api/payments
// =====================================================

export const createPayment =
  async (req, res) => {

    const connection =
      await pool.getConnection();

    try {

      const {
        SaleID,
        CustomerID,
        Amount,
        PaymentMode,
        PaymentType,
        Notes
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !Amount ||
        Number(Amount) <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Payment amount is required."

        });

      }

      const paymentAmount =
        Number(Amount);

      const saleId =
        SaleID
          ? Number(SaleID)
          : null;

      const customerId =
        CustomerID
          ? Number(CustomerID)
          : null;

      const paymentMode =
        PaymentMode ||
        "Cash";

      const paymentType =
        PaymentType ||
        "Received";

      // =================================================
      // VERIFY SALE
      // =================================================

      if (saleId) {

        const [saleRows] =
          await connection.query(`
            SELECT
              SaleID,
              CustomerID,
              GrandTotal
            FROM sales
            WHERE SaleID = ?
            LIMIT 1
          `, [saleId]);

        if (
          saleRows.length === 0
        ) {

          return res.status(404).json({

            success: false,

            message:
              "Sale not found."

          });

        }

      }

      // =================================================
      // INSERT PAYMENT
      // =================================================

      const [result] =
        await connection.query(`
          INSERT INTO payments
          (
            SaleID,
            CustomerID,
            Amount,
            PaymentMode,
            PaymentType,
            Notes
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
        `, [

          saleId,

          customerId,

          paymentAmount,

          paymentMode,

          paymentType,

          Notes ||
            null

        ]);

      // =================================================
      // UPDATE SALE PAYMENT STATUS
      // =================================================

      if (saleId) {

        const [paymentRows] =
          await connection.query(`
            SELECT

              COALESCE(
                SUM(
                  CASE
                    WHEN PaymentType = 'Received'
                    THEN Amount

                    WHEN PaymentType = 'Refund'
                    THEN -Amount

                    ELSE 0
                  END
                ),
                0
              ) AS paidAmount

            FROM payments

            WHERE SaleID = ?
          `, [saleId]);

        const paidAmount =
          Number(
            paymentRows[0]?.paidAmount || 0
          );

        const [saleRows] =
          await connection.query(`
            SELECT
              GrandTotal
            FROM sales
            WHERE SaleID = ?
            LIMIT 1
          `, [saleId]);

        if (
          saleRows.length > 0
        ) {

          const grandTotal =
            Number(
              saleRows[0].GrandTotal || 0
            );

          let paymentStatus =
            "Pending";

          if (
            paidAmount >=
            grandTotal
          ) {

            paymentStatus =
              "Paid";

          } else if (
            paidAmount > 0
          ) {

            paymentStatus =
              "Partial";

          }

          await connection.query(`
            UPDATE sales

            SET PaymentStatus = ?

            WHERE SaleID = ?
          `, [

            paymentStatus,

            saleId

          ]);

        }

      }

      res.status(201).json({

        success: true,

        message:
          "Payment recorded successfully.",

        paymentId:
          result.insertId

      });

    } catch (error) {

      console.error(
        "Create Payment Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to create payment.",

        error:
          error.message

      });

    } finally {

      connection.release();

    }
  };