import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  RefreshCw,
  CalendarDays,
  Loader2,
  FileText,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

import "./Reports.css";

import API_BASE_URL from "../../services/api.js";

const API =
  `${API_BASE_URL}/reports`;

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Reports() {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const firstDay = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] =
    useState(firstDay);

  const [toDate, setToDate] =
    useState(today);

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD REPORT
  ========================================================= */

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const query =
        `?from=${encodeURIComponent(
          fromDate
        )}&to=${encodeURIComponent(
          toDate
        )}`;

      const response =
        await fetch(
          `${API}/summary${query}`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load reports."
        );
      }

      setReport(
        data.report ||
          data.data ||
          data
      );
    } catch (err) {
      console.error(
        "Report load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SAFE VALUES
  ========================================================= */

  const getNumber = (
    object,
    keys
  ) => {
    if (!object) return 0;

    for (const key of keys) {
      if (
        object[key] !==
          undefined &&
        object[key] !== null
      ) {
        return Number(
          object[key]
        ) || 0;
      }
    }

    return 0;
  };

  const getArray = (
    object,
    keys
  ) => {
    if (!object) return [];

    for (const key of keys) {
      if (
        Array.isArray(
          object[key]
        )
      ) {
        return object[key];
      }
    }

    return [];
  };

  /* =========================================================
     NORMALIZED REPORT DATA
  ========================================================= */

  const stats = useMemo(() => {
    return {
      totalSales:
        getNumber(report, [
          "totalSales",
          "sales",
        ]),

      totalPurchases:
        getNumber(report, [
          "totalPurchases",
          "purchases",
        ]),

      totalPayments:
        getNumber(report, [
          "totalPayments",
          "payments",
        ]),

      totalCustomers:
        getNumber(report, [
          "totalCustomers",
          "customers",
        ]),

      totalProducts:
        getNumber(report, [
          "totalProducts",
          "products",
        ]),

      lowStock:
        getNumber(report, [
          "lowStock",
          "lowStockItems",
        ]),

      profit:
        getNumber(report, [
          "profit",
          "netProfit",
        ]),
    };
  }, [report]);

  const monthlySales =
    getArray(report, [
      "monthlySales",
      "salesByMonth",
    ]);

  const paymentMethods =
    getArray(report, [
      "paymentMethods",
      "paymentsByMethod",
    ]);

  const topProducts =
    getArray(report, [
      "topProducts",
      "bestSellingProducts",
    ]);

  /* =========================================================
     MAX SALES FOR BAR CHART
  ========================================================= */

  const maxMonthlySales =
    Math.max(
      ...monthlySales.map(
        (item) =>
          Number(
            item.total ??
              item.amount ??
              item.sales ??
              0
          )
      ),
      1
    );

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (
    value
  ) => {
    if (!value) return "-";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="reports-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="reports-page-top">

        <div>
          <h1>Reports</h1>

          <p>
            Analyze sales, purchases,
            payments and inventory
            performance.
          </p>
        </div>

        <div className="report-actions">

          <div className="date-filter">

            <CalendarDays size={16} />

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />

            <span>to</span>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />

          </div>

          <button
            type="button"
            className="report-refresh-btn"
            onClick={loadReport}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="report-error">

          <AlertTriangle
            size={17}
          />

          <span>
            {error}
          </span>

        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="reports-loading">

          <Loader2
            size={32}
            className="spin"
          />

          <span>
            Loading report data...
          </span>

        </div>
      ) : (
        <>
          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <div className="report-summary-grid">

            <div className="report-stat-card">

              <div className="report-stat-icon blue">
                <TrendingUp
                  size={21}
                />
              </div>

              <div>
                <span>
                  Total Sales
                </span>

                <strong>
                  ₹
                  {money(
                    stats.totalSales
                  )}
                </strong>
              </div>

            </div>

            <div className="report-stat-card">

              <div className="report-stat-icon orange">
                <ShoppingCart
                  size={21}
                />
              </div>

              <div>
                <span>
                  Total Purchases
                </span>

                <strong>
                  ₹
                  {money(
                    stats.totalPurchases
                  )}
                </strong>
              </div>

            </div>

            <div className="report-stat-card">

              <div className="report-stat-icon green">
                <IndianRupee
                  size={21}
                />
              </div>

              <div>
                <span>
                  Payments
                </span>

                <strong>
                  ₹
                  {money(
                    stats.totalPayments
                  )}
                </strong>
              </div>

            </div>

            <div className="report-stat-card">

              <div className="report-stat-icon purple">
                <Users size={21} />
              </div>

              <div>
                <span>
                  Customers
                </span>

                <strong>
                  {stats.totalCustomers}
                </strong>
              </div>

            </div>

          </div>

          {/* =================================================
              SECONDARY STATS
          ================================================= */}

          <div className="report-mini-grid">

            <div className="report-mini-card">

              <Package size={19} />

              <div>
                <span>
                  Products
                </span>

                <strong>
                  {stats.totalProducts}
                </strong>
              </div>

            </div>

            <div className="report-mini-card warning">

              <AlertTriangle
                size={19}
              />

              <div>
                <span>
                  Low Stock
                </span>

                <strong>
                  {stats.lowStock}
                </strong>
              </div>

            </div>

            <div className="report-mini-card success">

              <TrendingUp
                size={19}
              />

              <div>
                <span>
                  Net Profit
                </span>

                <strong>
                  ₹
                  {money(
                    stats.profit
                  )}
                </strong>
              </div>

            </div>

            <div className="report-mini-card">

              <FileText size={19} />

              <div>
                <span>
                  Report Period
                </span>

                <strong>
                  {formatDate(
                    fromDate
                  )}{" "}
                  -{" "}
                  {formatDate(
                    toDate
                  )}
                </strong>
              </div>

            </div>

          </div>

          {/* =================================================
              CHARTS
          ================================================= */}

          <div className="report-chart-grid">

            {/* MONTHLY SALES */}

            <div className="report-card">

              <div className="report-card-header">

                <div>
                  <h2>
                    Monthly Sales
                  </h2>

                  <span>
                    Sales performance
                  </span>
                </div>

                <BarChart3
                  size={20}
                />

              </div>

              {monthlySales.length ===
              0 ? (
                <div className="chart-empty">
                  No monthly sales data
                  available.
                </div>
              ) : (
                <div className="bar-chart">

                  {monthlySales.map(
                    (
                      item,
                      index
                    ) => {

                      const value =
                        Number(
                          item.total ??
                            item.amount ??
                            item.sales ??
                            0
                        );

                      const height =
                        Math.max(
                          (value /
                            maxMonthlySales) *
                            100,
                          3
                        );

                      return (
                        <div
                          className="bar-column"
                          key={
                            item.month ||
                            index
                          }
                        >

                          <div className="bar-value">
                            ₹
                            {money(
                              value
                            )}
                          </div>

                          <div className="bar-track">

                            <div
                              className="bar-fill"
                              style={{
                                height:
                                  `${height}%`,
                              }}
                            />

                          </div>

                          <span>
                            {item.month ||
                              item.label ||
                              "-"}
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>


            {/* PAYMENT METHODS */}

            <div className="report-card">

              <div className="report-card-header">

                <div>
                  <h2>
                    Payment Methods
                  </h2>

                  <span>
                    Payment collection
                  </span>
                </div>

                <CreditCard
                  size={20}
                />

              </div>

              {paymentMethods.length ===
              0 ? (
                <div className="chart-empty">
                  No payment method
                  data available.
                </div>
              ) : (
                <div className="payment-method-list">

                  {paymentMethods.map(
                    (
                      item,
                      index
                    ) => {

                      const amount =
                        Number(
                          item.amount ??
                            item.total ??
                            0
                        );

                      const method =
                        item.method ||
                        item.paymentMethod ||
                        "Unknown";

                      const percentage =
                        stats.totalPayments >
                        0
                          ? (
                              (amount /
                                stats.totalPayments) *
                              100
                            ).toFixed(
                              1
                            )
                          : 0;

                      return (
                        <div
                          className="payment-method-row"
                          key={
                            method ||
                            index
                          }
                        >

                          <div className="method-name">

                            <div className="method-dot" />

                            <span>
                              {String(
                                method
                              ).replace(
                                "_",
                                " "
                              )}
                            </span>

                          </div>

                          <div className="method-progress">

                            <div className="method-progress-track">

                              <div
                                className="method-progress-fill"
                                style={{
                                  width:
                                    `${percentage}%`,
                                }}
                              />

                            </div>

                          </div>

                          <strong>
                            ₹
                            {money(
                              amount
                            )}
                          </strong>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

          </div>

          {/* =================================================
              TOP PRODUCTS
          ================================================= */}

          <div className="report-card">

            <div className="report-card-header">

              <div>
                <h2>
                  Top Selling Products
                </h2>

                <span>
                  Best performing products
                </span>
              </div>

              <Package
                size={20}
              />

            </div>

            {topProducts.length ===
            0 ? (
              <div className="chart-empty">
                No product sales data
                available.
              </div>
            ) : (
              <div className="top-products-table-wrapper">

                <table className="top-products-table">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Sales</th>
                    </tr>
                  </thead>

                  <tbody>

                    {topProducts.map(
                      (
                        product,
                        index
                      ) => {

                        const name =
                          product.productName ||
                          product.ProductName ||
                          product.name ||
                          "-";

                        const quantity =
                          product.quantity ||
                          product.Quantity ||
                          0;

                        const sales =
                          product.sales ||
                          product.amount ||
                          product.total ||
                          0;

                        return (
                          <tr
                            key={
                              product.productId ||
                              product.ProductID ||
                              index
                            }
                          >

                            <td>
                              <span className="rank-number">
                                {index + 1}
                              </span>
                            </td>

                            <td>
                              <strong>
                                {name}
                              </strong>
                            </td>

                            <td>
                              {quantity}
                            </td>

                            <td className="report-amount">
                              ₹
                              {money(
                                sales
                              )}
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </>
      )}

    </div>
  );
}

export default Reports;
