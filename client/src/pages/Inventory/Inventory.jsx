import React, {
  useMemo,
  useState,
} from "react";

import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  TriangleAlert,
  Search,
  RefreshCw,
} from "lucide-react";

import useInventory from "./useInventory.js";

import "./Inventory.css";

function Inventory() {
  const {
    inventory,
    summary,
    loading,
    error,
    loadInventory,
    updateStock,
  } = useInventory();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    stockLoading,
    setStockLoading,
  ] = useState(false);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredInventory =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return inventory;
      }

      return inventory.filter(
        (item) =>
          String(
            item.ProductCode || ""
          )
            .toLowerCase()
            .includes(searchValue) ||

          String(
            item.ProductName || ""
          )
            .toLowerCase()
            .includes(searchValue) ||

          String(
            item.CategoryName || ""
          )
            .toLowerCase()
            .includes(searchValue) ||

          String(
            item.BrandName || ""
          )
            .toLowerCase()
            .includes(searchValue)
      );
    }, [
      inventory,
      search,
    ]);

  // =====================================================
  // STOCK IN
  // =====================================================

  const handleStockIn =
    async (item) => {
      const value =
        window.prompt(
          `Enter stock quantity to add for ${item.ProductName}:`
        );

      if (
        value === null
      ) {
        return;
      }

      const quantity =
        Number(value);

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        alert(
          "Please enter a valid positive quantity."
        );

        return;
      }

      try {
        setStockLoading(true);

        await updateStock({
          ProductID:
            item.ProductID,

          Quantity:
            quantity,

          operation:
            "IN",

          notes:
            "Manual stock addition",
        });

        alert(
          "Stock added successfully."
        );

      } catch (err) {
        console.error(
          "Stock In Error:",
          err
        );

        alert(
          err.message ||
            "Unable to add stock."
        );

      } finally {
        setStockLoading(false);
      }
    };

  // =====================================================
  // STOCK OUT
  // =====================================================

  const handleStockOut =
    async (item) => {
      const value =
        window.prompt(
          `Enter stock quantity to remove for ${item.ProductName}:`
        );

      if (
        value === null
      ) {
        return;
      }

      const quantity =
        Number(value);

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        alert(
          "Please enter a valid positive quantity."
        );

        return;
      }

      if (
        quantity >
        Number(
          item.AvailableQuantity
        )
      ) {
        alert(
          "Stock cannot become negative."
        );

        return;
      }

      try {
        setStockLoading(true);

        await updateStock({
          ProductID:
            item.ProductID,

          Quantity:
            quantity,

          operation:
            "OUT",

          notes:
            "Manual stock removal",
        });

        alert(
          "Stock removed successfully."
        );

      } catch (err) {
        console.error(
          "Stock Out Error:",
          err
        );

        alert(
          err.message ||
            "Unable to remove stock."
        );

      } finally {
        setStockLoading(false);
      }
    };

  // =====================================================
  // PRICE FORMAT
  // =====================================================

  const formatCurrency =
    (value) => {
      return Number(
        value || 0
      ).toLocaleString(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }
      );
    };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="inventory-loading">
          <RefreshCw
            size={24}
            className="spin"
          />

          <span>
            Loading inventory...
          </span>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="inventory-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-top">

        <div>
          <h1>
            Inventory
          </h1>

          <p>
            Track stock movement and current inventory.
          </p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={loadInventory}
          disabled={loading}
        >
          <RefreshCw
            size={16}
          />

          Refresh
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="inventory-error">
          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="inventory-summary">

        <div className="inventory-stat">

          <Package />

          <span>
            Total Stock
          </span>

          <strong>
            {Number(
              summary.TotalStock || 0
            ).toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

        <div className="inventory-stat">

          <ArrowDownToLine />

          <span>
            Available Stock
          </span>

          <strong>
            {Number(
              summary.AvailableStock ||
                0
            ).toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

        <div className="inventory-stat">

          <ArrowUpFromLine />

          <span>
            Reserved Stock
          </span>

          <strong>
            {Number(
              summary.ReservedStock ||
                0
            ).toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

        <div className="inventory-stat warning">

          <TriangleAlert />

          <span>
            Low Stock
          </span>

          <strong>
            {Number(
              summary.LowStock || 0
            ).toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

      </div>

      {/* =================================================
          INVENTORY VALUE
      ================================================= */}

      <div className="inventory-value-card">

        <div>
          <span>
            Total Inventory Value
          </span>

          <strong>
            {formatCurrency(
              summary.InventoryValue
            )}
          </strong>
        </div>

        <div>
          <span>
            Products
          </span>

          <strong>
            {Number(
              summary.TotalProducts ||
                0
            ).toLocaleString(
              "en-IN"
            )}
          </strong>
        </div>

        <div>
          <span>
            Out of Stock
          </span>

          <strong className="danger-text">
            {Number(
              summary.OutOfStock ||
                0
            ).toLocaleString(
              "en-IN"
            )}
          </strong>
        </div>

      </div>

      {/* =================================================
          CONTENT CARD
      ================================================= */}

      <div className="content-card">

        <div className="table-toolbar">

          <div>
            <h2>
              Stock Overview
            </h2>

            <span>
              Current product inventory
            </span>
          </div>

          <div className="toolbar-right">

            <div className="search-box">

              <Search
                size={17}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search SKU or product..."
              />

            </div>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="responsive-table">

          <table>

            <thead>

              <tr>
                <th>SKU</th>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
                <th>STOCK</th>
                <th>RESERVED</th>
                <th>AVAILABLE</th>
                <th>PRICE</th>
                <th>ACTION</th>
              </tr>

            </thead>

            <tbody>

              {filteredInventory.map(
                (item) => {

                  const stock =
                    Number(
                      item.Quantity || 0
                    );

                  const reserved =
                    Number(
                      item.ReservedQuantity ||
                        0
                    );

                  const available =
                    Number(
                      item.AvailableQuantity ??
                        stock -
                        reserved
                    );

                  return (
                    <tr
                      key={
                        item.InventoryID ||
                        item.ProductID
                      }
                    >

                      <td>
                        <span className="inventory-sku">
                          {item.ProductCode ||
                            `PRD-${item.ProductID}`}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {item.ProductName ||
                            "Unnamed Product"}
                        </strong>
                      </td>

                      <td>
                        <span className="category-badge">
                          {item.CategoryName ||
                            item.ProductType ||
                            "Other"}
                        </span>
                      </td>

                      <td>
                        {item.BrandName ||
                          "Generic"}
                      </td>

                      <td>
                        <strong>
                          {stock}
                        </strong>
                      </td>

                      <td>
                        {reserved}
                      </td>

                      <td>

                        <strong
                          className={
                            available <= 10
                              ? "stock-low"
                              : "stock-good"
                          }
                        >
                          {available}
                        </strong>

                      </td>

                      <td className="inventory-price">
                        {formatCurrency(
                          item.LastPurchasePrice
                        )}
                      </td>

                      <td>

                        <div className="inventory-actions">

                          <button
                            type="button"
                            className="stock-in-btn"
                            disabled={
                              stockLoading
                            }
                            onClick={() =>
                              handleStockIn(
                                item
                              )
                            }
                            title="Stock In"
                          >
                            <ArrowDownToLine
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            className="stock-out-btn"
                            disabled={
                              stockLoading
                            }
                            onClick={() =>
                              handleStockOut(
                                item
                              )
                            }
                            title="Stock Out"
                          >
                            <ArrowUpFromLine
                              size={15}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            EMPTY
        ================================================= */}

        {filteredInventory.length ===
          0 && (
            <div className="inventory-empty">

              <Package
                size={40}
              />

              <h3>
                {search
                  ? "No inventory found"
                  : "No inventory available"}
              </h3>

              <p>
                {search
                  ? "Try another search."
                  : "Add a product first to create inventory."}
              </p>

            </div>
          )}

      </div>

    </div>
  );
}

export default Inventory;