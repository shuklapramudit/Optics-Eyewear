import React, {
  useEffect,
  useState
} from "react";

import {
  Glasses,
  Package,
  IndianRupee,
  TriangleAlert,
  CalendarDays,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Bell,
  X,
  BarChart3
} from "lucide-react";

import "./Dashboard.css";


function Dashboard() {

  // =====================================================
  // DASHBOARD STATE
  // =====================================================

  const [dashboardData, setDashboardData] =
    useState({

      stats: {
        totalProducts: 0,
        availableStock: 0,
        todaysSales: 0,
        lowStockItems: 0
      },

      recentSales: [],

      lowStockItems: [],

      monthlySales: [],

      user: null

    });


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [stockAlertVisible, setStockAlertVisible] =
    useState(false);


  // =====================================================
  // API
  // =====================================================

const DASHBOARD_API =
  "https://inventry-management-system-k9a5.onrender.com/api/dashboard";

const STOCK_API =
  "https://inventry-management-system-k9a5.onrender.com/api/products";


  const LOW_STOCK_LIMIT = 10;


  // =====================================================
  // GET PRODUCT STOCK
  // =====================================================

  const getProductStock = (product) => {

    const value =
      product?.StockQuantity ??
      product?.Stock ??
      product?.Quantity ??
      product?.stockQuantity ??
      product?.stock ??
      product?.quantity ??
      0;


    const numericValue =
      Number(value);


    return Number.isFinite(
      numericValue
    )
      ? numericValue
      : 0;

  };


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {

    try {

      setLoading(true);

      setError("");


      // -------------------------------------------------
      // Dashboard + Products API
      // -------------------------------------------------

      const [
        dashboardResult,
        productsResult
      ] =
        await Promise.allSettled([

          fetch(
            DASHBOARD_API
          ),

          fetch(
            STOCK_API
          )

        ]);


      // -------------------------------------------------
      // DEFAULT DATA
      // -------------------------------------------------

      let nextDashboardData = {

        stats: {
          totalProducts: 0,
          availableStock: 0,
          todaysSales: 0,
          lowStockItems: 0
        },

        recentSales: [],

        lowStockItems: [],

        monthlySales: [],

        user: null

      };


      let dashboardLoaded =
        false;


      let productsLoaded =
        false;


      // =================================================
      // DASHBOARD API
      // =================================================

      if (
        dashboardResult.status ===
          "fulfilled" &&
        dashboardResult.value.ok
      ) {

        try {

          const data =
            await dashboardResult
              .value
              .json();


          if (
            data &&
            typeof data === "object"
          ) {

            nextDashboardData = {

              ...nextDashboardData,

              ...data,

              stats: {

                ...nextDashboardData.stats,

                ...(data.stats || {})

              },


              recentSales:
                Array.isArray(
                  data.recentSales
                )
                  ? data.recentSales
                  : [],


              lowStockItems:
                Array.isArray(
                  data.lowStockItems
                )
                  ? data.lowStockItems
                  : [],


              monthlySales:
                Array.isArray(
                  data.monthlySales
                )
                  ? data.monthlySales
                  : [],


              user:
                data.user ||
                null

            };


            dashboardLoaded =
              true;

          }

        } catch (
          dashboardJsonError
        ) {

          console.error(
            "Dashboard JSON error:",
            dashboardJsonError
          );

        }

      }


      // =================================================
      // PRODUCTS API
      //
      // Used as a reliable stock fallback.
      // =================================================

      if (
        productsResult.status ===
          "fulfilled" &&
        productsResult.value.ok
      ) {

        try {

          const productData =
            await productsResult
              .value
              .json();


          const products =
            Array.isArray(
              productData?.products
            )
              ? productData.products
              : Array.isArray(
                  productData?.data
                )
                ? productData.data
                : [];


          // ---------------------------------------------
          // AVAILABLE STOCK
          // ---------------------------------------------

          const availableStock =
            products.reduce(
              (
                total,
                product
              ) =>
                total +
                getProductStock(
                  product
                ),
              0
            );


          // ---------------------------------------------
          // LOW STOCK PRODUCTS
          // ---------------------------------------------

          const lowStockProducts =
            products

              .map(
                (product) => ({

                  ...product,

                  DashboardStock:
                    getProductStock(
                      product
                    )

                })
              )

              .filter(
                (product) =>
                  product.DashboardStock <=
                  LOW_STOCK_LIMIT
              )

              .sort(
                (a, b) =>
                  a.DashboardStock -
                  b.DashboardStock
              );


          // ---------------------------------------------
          // UPDATE STOCK DATA
          // ---------------------------------------------

          nextDashboardData = {

            ...nextDashboardData,

            stats: {

              ...nextDashboardData.stats,

              totalProducts:
                products.length,

              availableStock,

              lowStockItems:
                lowStockProducts.length

            },

            lowStockItems:
              lowStockProducts

          };


          productsLoaded =
            true;

        } catch (
          productJsonError
        ) {

          console.error(
            "Product stock JSON error:",
            productJsonError
          );

        }

      }


      // =================================================
      // IF BOTH API FAILED
      // =================================================

      if (
        !dashboardLoaded &&
        !productsLoaded
      ) {

        throw new Error(
          "Unable to load dashboard and inventory data."
        );

      }


      // =================================================
      // SET DATA
      // =================================================

      setDashboardData(
        nextDashboardData
      );


      // =================================================
      // LOW STOCK NOTIFICATION
      // =================================================

      setStockAlertVisible(
        Number(
          nextDashboardData
            ?.stats
            ?.lowStockItems || 0
        ) > 0
      );


    } catch (err) {

      console.error(
        "Dashboard error:",
        err
      );


      setError(
        err.message ||
        "Unable to load dashboard data."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  // =====================================================
  // DATA
  // =====================================================

  const {
    stats,
    recentSales,
    lowStockItems,
    monthlySales,
    user
  } =
    dashboardData;


  // =====================================================
  // USER INITIALS
  // =====================================================

  const getInitials = (
    name
  ) => {

    if (!name) {
      return "GU";
    }


    const words =
      String(name)
        .trim()
        .split(/\s+/);


    if (
      words.length === 1
    ) {

      return words[0]
        .substring(0, 2)
        .toUpperCase();

    }


    return (

      words[0]
        .charAt(0) +

      words[
        words.length - 1
      ].charAt(0)

    ).toUpperCase();

  };


  // =====================================================
  // USER NAME
  // =====================================================

  const userName =
    user?.FullName ||
    user?.fullName ||
    user?.name ||
    "Guest User";


  // =====================================================
  // USER ROLE
  // =====================================================

  const userRole =
    user?.Role ||
    user?.role ||
    "Administrator";


  // =====================================================
  // STATISTICS
  // =====================================================

  const statsData = [

    {
      title:
        "TOTAL PRODUCTS",

      value:
        Number(
          stats?.totalProducts ||
          0
        ).toLocaleString(
          "en-IN"
        ),

      change:
        "Live from inventory",

      type:
        "positive",

      icon:
        Glasses,

      iconClass:
        "blue",

      changeIcon:
        ArrowUpRight

    },


    {
      title:
        "AVAILABLE STOCK",

      value:
        Number(
          stats?.availableStock ||
          0
        ).toLocaleString(
          "en-IN"
        ),

      change:
        "Current stock",

      type:
        "positive",

      icon:
        Package,

      iconClass:
        "green",

      changeIcon:
        ArrowUpRight

    },


    {
      title:
        "TODAY'S SALES",

      value:
        `₹${Number(
          stats?.todaysSales ||
          0
        ).toLocaleString(
          "en-IN"
        )}`,

      change:
        "Today's transactions",

      type:
        "positive",

      icon:
        IndianRupee,

      iconClass:
        "orange",

      changeIcon:
        ArrowUpRight

    },


    {
      title:
        "LOW STOCK ITEMS",

      value:
        Number(
          stats?.lowStockItems ||
          0
        ).toLocaleString(
          "en-IN"
        ),

      change:
        "Need attention",

      type:
        "negative",

      icon:
        TriangleAlert,

      iconClass:
        "red",

      changeIcon:
        ArrowDownRight

    }

  ];


  // =====================================================
  // CURRENT DATE
  // =====================================================

  const currentDate =
    new Date().toLocaleDateString(
      "en-IN",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric"
      }
    );


  // =====================================================
  // MONTHLY SALES
  // =====================================================

  const normalizedMonthlySales =
    Array.isArray(
      monthlySales
    )
      ? monthlySales
      : [];


  const monthlySalesMaximum =
    Math.max(
      ...normalizedMonthlySales.map(
        (item) =>
          Number(
            item?.SalesAmount ||
            item?.salesAmount ||
            item?.sales ||
            0
          )
      ),
      0
    );


  const getMonthSales =
    (item) => {

      const value =
        Number(
          item?.SalesAmount ??
          item?.salesAmount ??
          item?.sales ??
          item?.Amount ??
          0
        );


      return Number.isFinite(
        value
      )
        ? value
        : 0;

    };


  // =====================================================
  // MONTHLY SALES LABEL
  // =====================================================

  const getMonthLabel =
    (item) => {

      if (
        item?.Month
      ) {

        return item.Month;

      }


      if (
        item?.month
      ) {

        return item.month;

      }


      if (
        item?.MonthKey
      ) {

        const date =
          new Date(
            `${item.MonthKey}-01`
          );


        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {

          return date.toLocaleDateString(
            "en-US",
            {
              month:
                "short"
            }
          );

        }

      }


      return "Month";

    };


  // =====================================================
  // MONTHLY SALES TOTAL
  // =====================================================

  const monthlySalesTotal =
    normalizedMonthlySales.reduce(
      (
        total,
        item
      ) =>
        total +
        getMonthSales(
          item
        ),
      0
    );


  // =====================================================
  // MONTHLY SALES AVERAGE
  // =====================================================

  const monthlySalesAverage =
    normalizedMonthlySales.length
      ? monthlySalesTotal /
        normalizedMonthlySales.length
      : 0;


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div
        className=
          "dashboard-loading"
      >

        <RefreshCw
          size={25}
          className=
            "loading-icon"
        />

        <span>
          Loading dashboard...
        </span>

      </div>

    );

  }


  // =====================================================
  // RETURN
  // =====================================================

  return (

    <div
      className=
        "dashboard-page"
    >


      {/* =================================================
          DASHBOARD HEADER
      ================================================= */}

      <section
        className=
          "dashboard-heading"
      >

        <div
          className=
            "dashboard-heading-content"
        >

          <h1>
            Dashboard
          </h1>


          <p>

            Welcome back,{" "}

            <strong>
              {userName}
            </strong>

            . Here's what's happening
            with your inventory today.

          </p>

        </div>


        <div
          className=
            "dashboard-heading-right"
        >

          <div
            className=
              "dashboard-user"
          >

            <div
              className=
                "dashboard-user-avatar"
            >
              {getInitials(
                userName
              )}
            </div>


            <div
              className=
                "dashboard-user-info"
            >

              <strong>
                {userName}
              </strong>

              <span>
                {userRole}
              </span>

            </div>

          </div>


          <div
            className=
              "dashboard-date"
          >

            <CalendarDays
              size={17}
            />

            <span>
              {currentDate}
            </span>

          </div>

        </div>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div
          className=
            "dashboard-error"
        >

          <TriangleAlert
            size={18}
          />


          <span>
            {error}
          </span>


          <button
            type="button"
            onClick={
              loadDashboard
            }
          >
            Retry
          </button>

        </div>

      )}


      {/* =================================================
          LOW STOCK NOTIFICATION
      ================================================= */}

      {stockAlertVisible &&
        Number(
          stats?.lowStockItems ||
          0
        ) > 0 && (

          <div
            className=
              "dashboard-stock-notification"
          >

            <div
              className=
                "stock-notification-icon"
            >

              <Bell
                size={19}
              />

            </div>


            <div
              className=
                "stock-notification-content"
            >

              <strong>
                Low Stock Alert
              </strong>


              <span>

                {Number(
                  stats?.lowStockItems ||
                  0
                )}

                {" "}

                {Number(
                  stats?.lowStockItems ||
                  0
                ) === 1
                  ? "product needs"
                  : "products need"}

                {" "}
                restocking.

              </span>

            </div>


            <button
              type="button"
              className=
                "stock-notification-close"
              onClick={() =>
                setStockAlertVisible(
                  false
                )
              }
              aria-label=
                "Close low stock notification"
            >

              <X
                size={17}
              />

            </button>

          </div>

      )}


      {/* =================================================
          STATISTICS
      ================================================= */}

      <section
        className=
          "dashboard-stats"
      >

        {statsData.map(
          (stat) => {

            const Icon =
              stat.icon;


            const ChangeIcon =
              stat.changeIcon;


            return (

              <div
                className={
                  `stat-card ${stat.iconClass}`
                }
                key={
                  stat.title
                }
              >

                <div
                  className=
                    "stat-card-top"
                >

                  <div
                    className={
                      `stat-icon ${stat.iconClass}`
                    }
                  >

                    <Icon
                      size={22}
                      strokeWidth={2}
                    />

                  </div>


                  <div
                    className=
                      "stat-info"
                  >

                    <span
                      className=
                        "stat-title"
                    >
                      {stat.title}
                    </span>


                    <strong
                      className=
                        "stat-value"
                    >
                      {stat.value}
                    </strong>


                    <div
                      className={
                        `stat-change ${stat.type}`
                      }
                    >

                      <ChangeIcon
                        size={13}
                        strokeWidth={2.5}
                      />

                      <span>
                        {stat.change}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            );

          }
        )}

      </section>


      {/* =================================================
          MONTHLY SALES CHART
      ================================================= */}

      <section
        className=
          "dashboard-panel monthly-sales-panel"
      >

        <div
          className=
            "panel-header monthly-sales-header"
        >

          <div>

            <div
              className=
                "monthly-sales-title-row"
            >

              <div
                className=
                  "monthly-sales-icon"
              >

                <BarChart3
                  size={18}
                />

              </div>


              <div>

                <h2>
                  Monthly Sales
                </h2>

                <p>
                  Sales performance for the last 12 months
                </p>

              </div>

            </div>

          </div>


          <div
            className=
              "monthly-sales-summary"
          >

            <span>
              12 Month Total
            </span>

            <strong>
              ₹
              {monthlySalesTotal.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    0
                }
              )}
            </strong>

          </div>

        </div>


        {normalizedMonthlySales.length ===
        0 ? (

          <div
            className=
              "empty-dashboard chart-empty"
          >

            <BarChart3
              size={32}
            />

            <strong>
              No monthly sales data
            </strong>

            <span>
              Sales will appear here once transactions are recorded.
            </span>

          </div>

        ) : (

          <div
            className=
              "monthly-sales-chart"
          >

            <div
              className=
                "chart-y-axis"
            >

              <span>
                ₹
                {monthlySalesMaximum.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      0
                  }
                )}
              </span>

              <span>
                ₹
                {(
                  monthlySalesMaximum *
                  0.75
                ).toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      0
                  }
                )}
              </span>

              <span>
                ₹
                {(
                  monthlySalesMaximum *
                  0.5
                ).toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      0
                  }
                )}
              </span>

              <span>
                ₹
                {(
                  monthlySalesMaximum *
                  0.25
                ).toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      0
                  }
                )}
              </span>

              <span>
                ₹0
              </span>

            </div>


            <div
              className=
                "chart-area"
            >

              <div
                className=
                  "chart-grid-lines"
              >

                <span />
                <span />
                <span />
                <span />
                <span />

              </div>


              <div
                className=
                  "chart-bars"
              >

                {normalizedMonthlySales.map(
                  (
                    item,
                    index
                  ) => {

                    const value =
                      getMonthSales(
                        item
                      );


                    const height =
                      monthlySalesMaximum >
                      0
                        ? Math.max(
                            (
                              value /
                              monthlySalesMaximum
                            ) *
                              100,
                            value > 0
                              ? 5
                              : 0
                          )
                        : 0;


                    return (

                      <div
                        className=
                          "chart-bar-column"
                        key={
                          item.MonthKey ||
                          item.Month ||
                          index
                        }
                      >

                        <div
                          className=
                            "chart-bar-value"
                        >

                          {value > 0
                            ? `₹${value.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits:
                                    0
                                }
                              )}`
                            : "₹0"}

                        </div>


                        <div
                          className=
                            "chart-bar-wrapper"
                        >

                          <div
                            className=
                              "chart-bar"
                            style={{
                              height:
                                `${height}%`
                            }}
                            title={
                              `${getMonthLabel(
                                item
                              )}: ₹${value.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits:
                                    0
                                }
                              )}`
                            }
                          />

                        </div>


                        <span
                          className=
                            "chart-bar-label"
                        >
                          {getMonthLabel(
                            item
                          )}
                        </span>

                      </div>

                    );

                  }
                )}

              </div>

            </div>

          </div>

        )}


        {normalizedMonthlySales.length >
          0 && (

          <div
            className=
              "monthly-sales-footer"
          >

            <span>
              Average monthly sales
            </span>

            <strong>
              ₹
              {monthlySalesAverage.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    0
                }
              )}
            </strong>

          </div>

        )}

      </section>


      {/* =================================================
          BOTTOM SECTION
      ================================================= */}

      <section
        className=
          "dashboard-bottom"
      >


        {/* ==============================================
            RECENT SALES
        =============================================== */}

        <div
          className=
            "dashboard-panel recent-sales-panel"
        >

          <div
            className=
              "panel-header"
          >

            <div>

              <h2>
                Recent Sales
              </h2>

              <p>
                Latest transactions
              </p>

            </div>


            <button
              type="button"
              className=
                "view-all-button"
              onClick={() => {
                window.location.href =
                  "/sales";
              }}
            >

              <span>
                View All
              </span>

              <ArrowUpRight
                size={15}
              />

            </button>

          </div>


          <div
            className=
              "sales-table-container"
          >

            {recentSales.length ===
            0 ? (

              <div
                className=
                  "empty-dashboard"
              >
                No recent sales found.
              </div>

            ) : (

              <table
                className=
                  "sales-table"
              >

                <thead>

                  <tr>

                    <th>
                      INVOICE
                    </th>

                    <th>
                      CUSTOMER
                    </th>

                    <th>
                      PRODUCT
                    </th>

                    <th>
                      AMOUNT
                    </th>

                    <th>
                      STATUS
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {recentSales.map(
                    (
                      sale,
                      index
                    ) => (

                      <tr
                        key={
                          sale.SaleID ||
                          sale.InvoiceID ||
                          sale.invoice ||
                          index
                        }
                      >

                        <td>

                          <span
                            className=
                              "invoice-number"
                          >
                            {sale.InvoiceNumber ||
                              sale.invoice ||
                              `INV-${index + 1}`}
                          </span>

                        </td>


                        <td>

                          <span
                            className=
                              "customer-name"
                          >
                            {sale.CustomerName ||
                              sale.customer ||
                              sale.FullName ||
                              "Walk-in Customer"}
                          </span>

                        </td>


                        <td>

                          <span
                            className=
                              "product-name"
                          >
                            {sale.ProductName ||
                              sale.product ||
                              sale.Product ||
                              "Product"}
                          </span>

                        </td>


                        <td>

                          <span
                            className=
                              "sale-amount"
                          >

                            ₹
                            {Number(
                              sale.Amount ||
                              sale.TotalAmount ||
                              sale.amount ||
                              0
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              `sale-status ${
                                String(
                                  sale.Status ||
                                  sale.status ||
                                  "Paid"
                                ).toLowerCase() ===
                                "paid"
                                  ? "paid"
                                  : "pending"
                              }`
                            }
                          >

                            {sale.Status ||
                              sale.status ||
                              "Paid"}

                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </div>


        {/* ==============================================
            LOW STOCK
        =============================================== */}

        <div
          className=
            "dashboard-panel low-stock-panel"
        >

          <div
            className=
              "panel-header"
          >

            <div>

              <h2>
                Low Stock Alert
              </h2>

              <p>
                Products that need restocking
              </p>

            </div>


            <button
              type="button"
              className=
                "view-all-button"
              onClick={() => {
                window.location.href =
                  "/inventory?filter=low-stock";
              }}
            >

              <span>
                View All
              </span>

              <ArrowUpRight
                size={15}
              />

            </button>

          </div>


          <div
            className=
              "low-stock-list"
          >

            {lowStockItems.length ===
            0 ? (

              <div
                className=
                  "empty-dashboard"
              >

                <Package
                  size={28}
                />

                <strong>
                  Stock looks good
                </strong>

                <span>
                  No products are currently low in stock.
                </span>

              </div>

            ) : (

              lowStockItems.map(
                (
                  item,
                  index
                ) => (

                  <div
                    className=
                      "low-stock-item"
                    key={
                      item.ProductID ||
                      item.id ||
                      index
                    }
                  >

                    <div
                      className=
                        "stock-product-icon"
                    >

                      <Glasses
                        size={19}
                      />

                    </div>


                    <div
                      className=
                        "stock-product-info"
                    >

                      <strong>
                        {item.ProductName ||
                          item.name ||
                          "Product"}
                      </strong>


                      <span>
                        SKU:{" "}
                        {item.SKU ||
                          item.sku ||
                          "N/A"}
                      </span>

                    </div>


                    <div
                      className=
                        "stock-quantity"
                    >

                      <strong>
                        {Number(
                          item.DashboardStock ??
                          item.StockQuantity ??
                          item.Stock ??
                          item.Quantity ??
                          item.quantity ??
                          0
                        )}
                      </strong>

                      <span>
                        left
                      </span>

                    </div>

                  </div>

                )
              )

            )}

          </div>


          <button
            type="button"
            className=
              "inventory-button"
            onClick={() => {
              window.location.href =
                "/inventory";
            }}
          >

            <Eye
              size={16}
            />

            View Inventory

          </button>

        </div>

      </section>


    </div>

  );

}


export default Dashboard;