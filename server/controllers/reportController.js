import pool from "../config/db.js";


// =====================================================
// REPORT SUMMARY
// GET /api/reports/summary
// =====================================================

export const getReportSummary =
  async (req, res) => {

    try {

      // ===============================================
      // TOTAL SALES
      // ===============================================

      const [sales] =
        await pool.query(`
          SELECT

            COUNT(*) AS totalSales,

            COALESCE(
              SUM(GrandTotal),
              0
            ) AS totalSalesAmount,

            COALESCE(
              SUM(SubTotal),
              0
            ) AS taxableSales,

            COALESCE(
              SUM(GSTAmount),
              0
            ) AS totalGST,

            COALESCE(
              SUM(Discount),
              0
            ) AS totalDiscount

          FROM sales
        `);


      // ===============================================
      // TOTAL PURCHASES
      // ===============================================

      let purchaseSummary = {
        totalPurchases: 0,
        totalPurchaseAmount: 0
      };

      try {

        const [rows] =
          await pool.query(`
            SELECT

              COUNT(*) AS totalPurchases,

              COALESCE(
                SUM(
                  COALESCE(
                    GrandTotal,
                    TotalAmount,
                    0
                  )
                ),
                0
              ) AS totalPurchaseAmount

            FROM purchases
          `);

        purchaseSummary = {

          totalPurchases:
            Number(
              rows[0]?.totalPurchases || 0
            ),

          totalPurchaseAmount:
            Number(
              rows[0]?.totalPurchaseAmount || 0
            )

        };

      } catch (purchaseError) {

        console.warn(
          "Purchase summary unavailable:",
          purchaseError.message
        );

      }


      // ===============================================
      // PAYMENTS
      // ===============================================

      const [payments] =
        await pool.query(`
          SELECT

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
            ) AS totalRefund

          FROM payments
        `);


      // ===============================================
      // PRODUCTS
      // ===============================================

      const [products] =
        await pool.query(`
          SELECT
            COUNT(*) AS totalProducts
          FROM products
        `);


      // ===============================================
      // CUSTOMERS
      // ===============================================

      const [customers] =
        await pool.query(`
          SELECT
            COUNT(*) AS totalCustomers
          FROM customers
        `);


      // ===============================================
      // RESPONSE
      // ===============================================

      const totalSalesAmount =
        Number(
          sales[0]?.totalSalesAmount || 0
        );

      const totalPurchaseAmount =
        Number(
          purchaseSummary.totalPurchaseAmount || 0
        );

      const totalReceived =
        Number(
          payments[0]?.totalReceived || 0
        );

      const totalRefund =
        Number(
          payments[0]?.totalRefund || 0
        );


      res.status(200).json({

        success: true,

        summary: {

          totalSales:
            Number(
              sales[0]?.totalSales || 0
            ),

          totalSalesAmount,

          taxableSales:
            Number(
              sales[0]?.taxableSales || 0
            ),

          totalGST:
            Number(
              sales[0]?.totalGST || 0
            ),

          totalDiscount:
            Number(
              sales[0]?.totalDiscount || 0
            ),

          totalPurchases:
            purchaseSummary.totalPurchases,

          totalPurchaseAmount,

          totalReceived,

          totalRefund,

          netReceived:
            Number(
              (
                totalReceived -
                totalRefund
              ).toFixed(2)
            ),

          totalProducts:
            Number(
              products[0]?.totalProducts || 0
            ),

          totalCustomers:
            Number(
              customers[0]?.totalCustomers || 0
            ),

          grossProfit:
            Number(
              (
                totalSalesAmount -
                totalPurchaseAmount
              ).toFixed(2)
            )

        }

      });

    } catch (error) {

      console.error(
        "Report Summary Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load report summary.",

        error:
          error.message

      });

    }

  };


// =====================================================
// SALES REPORT
// GET /api/reports/sales
// =====================================================

export const getSalesReport =
  async (req, res) => {

    try {

      const from =
        req.query.from || null;

      const to =
        req.query.to || null;

      let query = `
        SELECT

          s.SaleID,

          s.InvoiceNumber,

          s.SaleDate,

          s.CustomerID,

          COALESCE(
            c.FullName,
            'Walk-in Customer'
          ) AS CustomerName,

          s.SubTotal,

          s.Discount,

          s.CGST,

          s.SGST,

          s.IGST,

          s.GSTAmount,

          s.RoundOff,

          s.GrandTotal,

          s.PaymentStatus,

          s.SaleStatus

        FROM sales s

        LEFT JOIN customers c
          ON c.CustomerID = s.CustomerID

        WHERE 1 = 1
      `;

      const params = [];


      if (from) {

        query += `
          AND DATE(s.SaleDate) >= ?
        `;

        params.push(from);

      }


      if (to) {

        query += `
          AND DATE(s.SaleDate) <= ?
        `;

        params.push(to);

      }


      query += `
        ORDER BY
          s.SaleDate DESC
      `;


      const [rows] =
        await pool.query(
          query,
          params
        );


      const total =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.GrandTotal || 0
            ),
          0
        );


      res.status(200).json({

        success: true,

        sales:
          rows,

        summary: {

          count:
            rows.length,

          total:
            Number(
              total.toFixed(2)
            )

        }

      });

    } catch (error) {

      console.error(
        "Sales Report Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load sales report.",

        error:
          error.message

      });

    }

  };


// =====================================================
// PAYMENT REPORT
// GET /api/reports/payments
// =====================================================

export const getPaymentReport =
  async (req, res) => {

    try {

      const [rows] =
        await pool.query(`
          SELECT

            p.PaymentID,

            p.SaleID,

            p.CustomerID,

            COALESCE(
              c.FullName,
              'Walk-in Customer'
            ) AS CustomerName,

            s.InvoiceNumber,

            p.Amount,

            p.PaymentMode,

            p.PaymentType,

            p.Notes

          FROM payments p

          LEFT JOIN customers c
            ON c.CustomerID =
               p.CustomerID

          LEFT JOIN sales s
            ON s.SaleID =
               p.SaleID

          ORDER BY
            p.PaymentID DESC
        `);


      res.status(200).json({

        success: true,

        payments:
          rows,

        summary: {

          count:
            rows.length,

          received:
            Number(
              rows
                .filter(
                  (row) =>
                    row.PaymentType ===
                    "Received"
                )
                .reduce(
                  (
                    sum,
                    row
                  ) =>
                    sum +
                    Number(
                      row.Amount || 0
                    ),
                  0
                )
                .toFixed(2)
            ),

          refund:
            Number(
              rows
                .filter(
                  (row) =>
                    row.PaymentType ===
                    "Refund"
                )
                .reduce(
                  (
                    sum,
                    row
                  ) =>
                    sum +
                    Number(
                      row.Amount || 0
                    ),
                  0
                )
                .toFixed(2)
            )

        }

      });

    } catch (error) {

      console.error(
        "Payment Report Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load payment report.",

        error:
          error.message

      });

    }

  };


// =====================================================
// MONTHLY SALES REPORT
// GET /api/reports/monthly-sales
// =====================================================

export const getMonthlySalesReport =
  async (req, res) => {

    try {

      const [rows] =
        await pool.query(`
          SELECT

            YEAR(SaleDate) AS Year,

            MONTH(SaleDate) AS Month,

            DATE_FORMAT(
              SaleDate,
              '%b'
            ) AS MonthName,

            COUNT(*) AS TotalInvoices,

            COALESCE(
              SUM(GrandTotal),
              0
            ) AS TotalSales

          FROM sales

          GROUP BY

            YEAR(SaleDate),

            MONTH(SaleDate),

            DATE_FORMAT(
              SaleDate,
              '%b'
            )

          ORDER BY

            YEAR(SaleDate) ASC,

            MONTH(SaleDate) ASC
        `);


      res.status(200).json({

        success: true,

        monthlySales:
          rows

      });

    } catch (error) {

      console.error(
        "Monthly Sales Report Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load monthly sales report.",

        error:
          error.message

      });

    }

  };