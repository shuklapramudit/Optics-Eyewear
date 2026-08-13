import pool from "../config/db.js";

// =====================================================
// GET DASHBOARD
// GET /api/dashboard
// =====================================================

export const getDashboard = async (req, res) => {
  try {

    // =====================================================
    // TOTAL PRODUCTS
    // =====================================================

    const [productCount] = await pool.query(`
      SELECT
        COUNT(*) AS totalProducts
      FROM products
    `);


    // =====================================================
    // AVAILABLE STOCK
    //
    // products table uses StockQuantity
    // =====================================================

    const [stockResult] = await pool.query(`
      SELECT
        COALESCE(
          SUM(StockQuantity),
          0
        ) AS availableStock
      FROM products
    `);


    const availableStock = Number(
      stockResult[0]?.availableStock || 0
    );


    // =====================================================
    // LOW STOCK PRODUCTS
    //
    // StockQuantity <= 10
    // =====================================================

    const [lowStockProducts] = await pool.query(`
      SELECT
        ProductID,
        ProductName,
        SKU,
        StockQuantity
      FROM products
      WHERE StockQuantity <= 10
      ORDER BY StockQuantity ASC
    `);


    const lowStockItemsCount =
      lowStockProducts.length;


    // =====================================================
    // TODAY'S SALES
    // =====================================================

    const [todaySales] = await pool.query(`
      SELECT

        COALESCE(
          SUM(
            COALESCE(SubTotal, 0)
            - COALESCE(Discount, 0)
            + COALESCE(CGST, 0)
            + COALESCE(SGST, 0)
            + COALESCE(IGST, 0)
            + COALESCE(GSTAmount, 0)
            + COALESCE(RoundOff, 0)
          ),
          0
        ) AS todaysSales

      FROM sales

      WHERE DATE(SaleDate) = CURDATE()
    `);


    // =====================================================
    // RECENT SALES
    // =====================================================

    const [recentSales] = await pool.query(`
      SELECT

        s.SaleID,

        s.InvoiceNumber,

        s.CustomerID,

        COALESCE(
          c.FullName,
          'Walk-in Customer'
        ) AS CustomerName,

        ROUND(
          COALESCE(
            s.SubTotal,
            0
          )
          - COALESCE(
            s.Discount,
            0
          )
          + COALESCE(
            s.CGST,
            0
          )
          + COALESCE(
            s.SGST,
            0
          )
          + COALESCE(
            s.IGST,
            0
          )
          + COALESCE(
            s.GSTAmount,
            0
          )
          + COALESCE(
            s.RoundOff,
            0
          ),
          2
        ) AS Amount,

        s.SaleDate

      FROM sales s

      LEFT JOIN customers c
        ON c.CustomerID = s.CustomerID

      ORDER BY
        s.SaleDate DESC

      LIMIT 5
    `);


    // =====================================================
    // MONTHLY SALES
    //
    // Last 12 months
    // =====================================================

    const [monthlySales] = await pool.query(`
      SELECT

        DATE_FORMAT(
          SaleDate,
          '%Y-%m'
        ) AS MonthKey,

        DATE_FORMAT(
          SaleDate,
          '%b %Y'
        ) AS Month,

        ROUND(
          COALESCE(
            SUM(
              COALESCE(SubTotal, 0)
              - COALESCE(Discount, 0)
              + COALESCE(CGST, 0)
              + COALESCE(SGST, 0)
              + COALESCE(IGST, 0)
              + COALESCE(GSTAmount, 0)
              + COALESCE(RoundOff, 0)
            ),
            0
          ),
          2
        ) AS SalesAmount

      FROM sales

      WHERE SaleDate >= DATE_SUB(
        CURDATE(),
        INTERVAL 11 MONTH
      )

      GROUP BY
        DATE_FORMAT(
          SaleDate,
          '%Y-%m'
        ),
        DATE_FORMAT(
          SaleDate,
          '%b %Y'
        )

      ORDER BY
        MonthKey ASC
    `);


    // =====================================================
    // FILL MISSING MONTHS
    //
    // Example:
    // Jan = 50000
    // Feb = 0
    // Mar = 35000
    //
    // Chart will always receive 12 months.
    // =====================================================

    const monthlySalesMap = {};

    monthlySales.forEach((item) => {

      monthlySalesMap[item.MonthKey] =
        Number(
          item.SalesAmount || 0
        );

    });


    const completeMonthlySales = [];

    const today = new Date();


    for (
      let i = 11;
      i >= 0;
      i--
    ) {

      const date = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );


      const year =
        date.getFullYear();


      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");


      const monthKey =
        `${year}-${month}`;


      const monthLabel =
        date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            year: "numeric"
          }
        );


      completeMonthlySales.push({

        MonthKey:
          monthKey,

        Month:
          monthLabel,

        SalesAmount:
          Number(
            monthlySalesMap[
              monthKey
            ] || 0
          )

      });

    }


    // =====================================================
    // USER INFORMATION
    // =====================================================

    let user = null;

    try {

      const [users] =
        await pool.query(`
          SELECT
            UserID,
            FullName,
            Email,
            Role,
            IsActive

          FROM users

          WHERE IsActive = 1

          ORDER BY UserID ASC

          LIMIT 1
        `);


      if (
        users.length > 0
      ) {

        user =
          users[0];

      }

    } catch (
      userError
    ) {

      console.log(
        "User information unavailable:",
        userError.message
      );

    }


    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(200).json({

      success: true,


      // ===================================================
      // DASHBOARD STATS
      // ===================================================

      stats: {

        totalProducts:
          Number(
            productCount[0]
              ?.totalProducts || 0
          ),


        availableStock:
          availableStock,


        todaysSales:
          Number(
            todaySales[0]
              ?.todaysSales || 0
          ),


        lowStockItems:
          Number(
            lowStockItemsCount || 0
          )

      },


      // ===================================================
      // RECENT SALES
      // ===================================================

      recentSales:
        recentSales,


      // ===================================================
      // LOW STOCK PRODUCTS
      // ===================================================

      lowStockItems:
        lowStockProducts.map(
          (item) => ({

            ProductID:
              item.ProductID,

            ProductName:
              item.ProductName,

            SKU:
              item.SKU,

            StockQuantity:
              Number(
                item.StockQuantity || 0
              ),

            DashboardStock:
              Number(
                item.StockQuantity || 0
              )

          })
        ),


      // ===================================================
      // MONTHLY SALES
      // ===================================================

      monthlySales:
        completeMonthlySales,


      // ===================================================
      // USER
      // ===================================================

      user

    });

  } catch (error) {

    console.error(
      "Dashboard API Error:",
      error.message
    );


    res.status(500).json({

      success: false,

      message:
        "Unable to load dashboard data.",

      error:
        error.message

    });

  }
};