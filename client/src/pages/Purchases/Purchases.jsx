import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ShoppingBag,
  Package,
  FileText,
  Plus,
  X,
  ChevronDown,
  UserPlus,
  PackagePlus
} from "lucide-react";

import "./Purchases.css";

const API =
  "https://inventry-management-system-k9a5.onrender.com/api/purchases";

function Purchases() {

  // =====================================================
  // LIST
  // =====================================================

  const [purchases, setPurchases] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // ADD MODAL
  // =====================================================

  const [showAddPurchase, setShowAddPurchase] =
    useState(false);

  const [purchaseMode, setPurchaseMode] =
    useState("single");

  const [formLoading, setFormLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  // =====================================================
  // FORM DATA
  // =====================================================

  const [suppliers, setSuppliers] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  // =====================================================
  // SUPPLIER
  // =====================================================

  const [supplierMode, setSupplierMode] =
    useState("existing");

  const [supplierId, setSupplierId] =
    useState("");

  const [manualSupplierName, setManualSupplierName] =
    useState("");

  // =====================================================
  // BASIC DETAILS
  // =====================================================

  const [supplierInvoice, setSupplierInvoice] =
    useState("");

  const [purchaseDate, setPurchaseDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [discount, setDiscount] =
    useState(0);

  const [paymentStatus, setPaymentStatus] =
    useState("Pending");

  const [notes, setNotes] =
    useState("");

  // =====================================================
  // SINGLE PRODUCT
  // =====================================================

  const [singleProductMode, setSingleProductMode] =
    useState("existing");

  const [singleProductId, setSingleProductId] =
    useState("");

  const [manualSingleProductName, setManualSingleProductName] =
    useState("");

  const [singleQuantity, setSingleQuantity] =
    useState(1);

  const [singleUnitPrice, setSingleUnitPrice] =
    useState("");

  const [singleGSTPercent, setSingleGSTPercent] =
    useState(18);

  // =====================================================
  // BULK ITEMS
  // =====================================================

  const [bulkItems, setBulkItems] =
    useState([
      {
        productMode: "existing",
        ProductID: "",
        ManualProductName: "",
        Quantity: 1,
        UnitPrice: "",
        GSTPercent: 18
      }
    ]);

  // =====================================================
  // VIEW
  // =====================================================

  const [selectedPurchase, setSelectedPurchase] =
    useState(null);

  const [selectedItems, setSelectedItems] =
    useState([]);

  const [showView, setShowView] =
    useState(false);

  // =====================================================
  // LOAD PURCHASES
  // =====================================================

  const loadPurchases = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await fetch(
          `${API}?search=${encodeURIComponent(
            search
          )}`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to load purchases."
        );
      }

      setPurchases(
        Array.isArray(data.purchases)
          ? data.purchases
          : []
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Unable to load purchases."
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadPurchases();

  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  useEffect(() => {

    const timer =
      setTimeout(
        loadPurchases,
        400
      );

    return () =>
      clearTimeout(timer);

  }, [search]);

  // =====================================================
  // LOAD FORM DATA
  // =====================================================

  const loadFormData =
    async () => {

      try {

        const response =
          await fetch(
            `${API}/form-data`
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
            "Unable to load form data."
          );
        }

        setSuppliers(
          Array.isArray(
            data.suppliers
          )
            ? data.suppliers
            : []
        );

        setProducts(
          Array.isArray(
            data.products
          )
            ? data.products
            : []
        );

      } catch (err) {

        console.error(err);

        setFormError(
          err.message ||
          "Unable to load suppliers/products."
        );

      }
    };

  // =====================================================
  // OPEN MODAL
  // =====================================================

  const openAddPurchase =
    async () => {

      setPurchaseMode("single");

      setSupplierMode("existing");

      setSupplierId("");

      setManualSupplierName("");

      setSupplierInvoice("");

      setPurchaseDate(
        new Date()
          .toISOString()
          .split("T")[0]
      );

      setDiscount(0);

      setPaymentStatus(
        "Pending"
      );

      setNotes("");

      setSingleProductMode(
        "existing"
      );

      setSingleProductId("");

      setManualSingleProductName(
        ""
      );

      setSingleQuantity(1);

      setSingleUnitPrice("");

      setSingleGSTPercent(18);

      setBulkItems([
        {
          productMode: "existing",
          ProductID: "",
          ManualProductName: "",
          Quantity: 1,
          UnitPrice: "",
          GSTPercent: 18
        }
      ]);

      setFormError("");

      setShowAddPurchase(true);

      await loadFormData();
    };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeAddPurchase =
    () => {

      if (formLoading) {
        return;
      }

      setShowAddPurchase(false);
      setFormError("");
    };

  // =====================================================
  // PRODUCT FINDER
  // =====================================================

  const getProduct =
    (id) => {

      return products.find(
        (product) =>
          String(
            product.ProductID
          ) === String(id)
      );
    };

  // =====================================================
  // SINGLE PRODUCT CHANGE
  // =====================================================

  const handleSingleProduct =
    (id) => {

      setSingleProductId(id);

      const product =
        getProduct(id);

      if (product) {

        setSingleUnitPrice(
          product.CostPrice ?? ""
        );

        setSingleGSTPercent(
          Number(
            product.GSTPercent || 0
          )
        );

      }
    };

  // =====================================================
  // BULK PRODUCT CHANGE
  // =====================================================

  const handleBulkProduct =
    (
      index,
      productId
    ) => {

      setBulkItems(
        (items) =>
          items.map(
            (item, itemIndex) => {

              if (
                itemIndex !== index
              ) {
                return item;
              }

              const product =
                getProduct(
                  productId
                );

              return {
                ...item,

                ProductID:
                  productId,

                ManualProductName:
                  "",

                UnitPrice:
                  product
                    ? product.CostPrice
                    : "",

                GSTPercent:
                  product
                    ? Number(
                        product.GSTPercent ||
                        0
                      )
                    : 18
              };
            }
          )
      );
    };

  // =====================================================
  // BULK FIELD CHANGE
  // =====================================================

  const updateBulkItem =
    (
      index,
      field,
      value
    ) => {

      setBulkItems(
        (items) =>
          items.map(
            (item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    [field]: value
                  }
                : item
          )
      );
    };

  // =====================================================
  // ADD BULK ITEM
  // =====================================================

  const addBulkItem =
    () => {

      setBulkItems(
        (items) => [
          ...items,
          {
            productMode:
              "existing",

            ProductID: "",

            ManualProductName:
              "",

            Quantity: 1,

            UnitPrice:
              "",

            GSTPercent:
              18
          }
        ]
      );
    };

  // =====================================================
  // REMOVE BULK ITEM
  // =====================================================

  const removeBulkItem =
    (index) => {

      if (
        bulkItems.length === 1
      ) {
        return;
      }

      setBulkItems(
        (items) =>
          items.filter(
            (_, itemIndex) =>
              itemIndex !== index
          )
      );
    };

  // =====================================================
  // SINGLE TOTAL
  // =====================================================

  const singleSubtotal =
    Number(singleQuantity || 0) *
    Number(singleUnitPrice || 0);

  const singleGST =
    singleSubtotal *
    Number(singleGSTPercent || 0) /
    100;

  const singleGrandTotal =
    Math.max(
      0,
      singleSubtotal -
        Number(discount || 0)
    ) +
    singleGST;

  // =====================================================
  // BULK TOTAL
  // =====================================================

  const bulkTotals =
    useMemo(() => {

      let subtotal = 0;
      let gst = 0;

      bulkItems.forEach(
        (item) => {

          const line =
            Number(
              item.Quantity || 0
            ) *
            Number(
              item.UnitPrice || 0
            );

          subtotal += line;

          gst +=
            line *
            Number(
              item.GSTPercent || 0
            ) /
            100;
        }
      );

      return {
        subtotal,
        gst,
        grandTotal:
          Math.max(
            0,
            subtotal -
              Number(discount || 0)
          ) + gst
      };

    }, [
      bulkItems,
      discount
    ]);

  // =====================================================
  // FORMAT
  // =====================================================

  const currency =
    (amount) =>
      new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency: "INR"
        }
      ).format(
        Number(amount || 0)
      );

  const formatDate =
    (date) => {

      if (!date) {
        return "-";
      }

      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      );
    };

  // =====================================================
  // CREATE PURCHASE
  // =====================================================

  const handleCreate =
    async (event) => {

      event.preventDefault();

      try {

        setFormLoading(true);

        setFormError("");

        // =================================================
        // SUPPLIER VALIDATION
        // =================================================

        if (
          supplierMode ===
          "existing"
        ) {

          if (!supplierId) {
            throw new Error(
              "Please select a supplier."
            );
          }

        } else {

          if (
            !manualSupplierName.trim()
          ) {
            throw new Error(
              "Please enter supplier name."
            );
          }
        }

        // =================================================
        // ITEMS
        // =================================================

        let items = [];

        if (
          purchaseMode ===
          "single"
        ) {

          if (
            singleProductMode ===
            "existing"
          ) {

            if (
              !singleProductId
            ) {
              throw new Error(
                "Please select a product."
              );
            }

          } else {

            if (
              !manualSingleProductName.trim()
            ) {
              throw new Error(
                "Please enter product name."
              );
            }
          }

          if (
            Number(singleQuantity) <= 0
          ) {
            throw new Error(
              "Quantity must be greater than 0."
            );
          }

          if (
            Number(singleUnitPrice) < 0 ||
            singleUnitPrice === ""
          ) {
            throw new Error(
              "Please enter valid unit price."
            );
          }

          items = [
            {
              ProductID:
                singleProductMode ===
                "existing"
                  ? Number(
                      singleProductId
                    )
                  : null,

              ManualProductName:
                singleProductMode ===
                "manual"
                  ? manualSingleProductName.trim()
                  : null,

              Quantity:
                Number(
                  singleQuantity
                ),

              UnitPrice:
                Number(
                  singleUnitPrice
                ),

              GSTPercent:
                Number(
                  singleGSTPercent
                )
            }
          ];

        } else {

          if (
            bulkItems.length === 0
          ) {
            throw new Error(
              "Please add at least one item."
            );
          }

          items =
            bulkItems.map(
              (item, index) => {

                if (
                  item.productMode ===
                  "existing" &&
                  !item.ProductID
                ) {
                  throw new Error(
                    `Please select product for row ${
                      index + 1
                    }.`
                  );
                }

                if (
                  item.productMode ===
                  "manual" &&
                  !item.ManualProductName.trim()
                ) {
                  throw new Error(
                    `Please enter product name for row ${
                      index + 1
                    }.`
                  );
                }

                if (
                  Number(
                    item.Quantity
                  ) <= 0
                ) {
                  throw new Error(
                    `Invalid quantity in row ${
                      index + 1
                    }.`
                  );
                }

                return {
                  ProductID:
                    item.productMode ===
                    "existing"
                      ? Number(
                          item.ProductID
                        )
                      : null,

                  ManualProductName:
                    item.productMode ===
                    "manual"
                      ? item.ManualProductName.trim()
                      : null,

                  Quantity:
                    Number(
                      item.Quantity
                    ),

                  UnitPrice:
                    Number(
                      item.UnitPrice || 0
                    ),

                  GSTPercent:
                    Number(
                      item.GSTPercent || 0
                    )
                };
              }
            );
        }

        // =================================================
        // API
        // =================================================

        const response =
          await fetch(
            `${API}/create`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  SupplierID:
                    supplierMode ===
                    "existing"
                      ? Number(
                          supplierId
                        )
                      : null,

                  ManualSupplierName:
                    supplierMode ===
                    "manual"
                      ? manualSupplierName.trim()
                      : null,

                  SupplierInvoiceNumber:
                    supplierInvoice.trim() ||
                    null,

                  PurchaseDate:
                    purchaseDate,

                  Discount:
                    Number(
                      discount || 0
                    ),

                  PaymentStatus:
                    paymentStatus,

                  Notes:
                    notes.trim() ||
                    null,

                  items
                })
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
            "Unable to create purchase."
          );
        }

        alert(
          `Purchase ${data.purchaseNumber} created successfully.`
        );

        setShowAddPurchase(
          false
        );

        await loadPurchases();

      } catch (err) {

        console.error(err);

        setFormError(
          err.message ||
          "Unable to create purchase."
        );

      } finally {

        setFormLoading(false);
      }
    };

  // =====================================================
  // VIEW
  // =====================================================

  const handleView =
    async (purchase) => {

      try {

        const response =
          await fetch(
            `${API}/${purchase.PurchaseID}`
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message
          );
        }

        const itemResponse =
          await fetch(
            `${API}/${purchase.PurchaseID}/items`
          );

        const itemData =
          await itemResponse.json();

        setSelectedPurchase(
          data.purchase
        );

        setSelectedItems(
          itemData.success
            ? itemData.items
            : []
        );

        setShowView(true);

      } catch (err) {

        alert(
          err.message ||
          "Unable to load purchase."
        );
      }
    };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete =
    async (purchase) => {

      if (
        !window.confirm(
          `Delete ${
            purchase.PurchaseNumber
          }?`
        )
      ) {
        return;
      }

      try {

        const response =
          await fetch(
            `${API}/${purchase.PurchaseID}`,
            {
              method:
                "DELETE"
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message
          );
        }

        await loadPurchases();

      } catch (err) {

        alert(
          err.message ||
          "Unable to delete purchase."
        );
      }
    };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="purchases-page">

      {/* HEADER */}

      <div className="purchases-header">

        <div>

          <h1>
            Purchase History
          </h1>

          <p>
            Recent supplier transactions
          </p>

        </div>

        <div className="purchase-header-actions">

          <button
            className="add-purchase-button"
            onClick={
              openAddPurchase
            }
          >

            <Plus size={17} />

            Add Purchase

          </button>

          <button
            className="refresh-button"
            onClick={
              loadPurchases
            }
            disabled={
              loading
            }
          >

            <RefreshCw
              size={17}
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

      {/* ERROR */}

      {error && (

        <div className="purchase-error">

          <strong>
            Unable to load purchases
          </strong>

          <span>
            {error}
          </span>

          <button
            onClick={
              loadPurchases
            }
          >
            Retry
          </button>

        </div>

      )}

      {/* SUMMARY */}

      <div className="purchase-summary">

        <div className="summary-card">

          <div className="summary-icon blue">

            <ShoppingBag
              size={22}
            />

          </div>

          <div>

            <span>
              Total Purchases
            </span>

            <strong>
              {purchases.length}
            </strong>

          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon green">

            <Package
              size={22}
            />

          </div>

          <div>

            <span>
              Purchase Amount
            </span>

            <strong>

              {currency(
                purchases.reduce(
                  (sum, item) =>
                    sum +
                    Number(
                      item.GrandTotal ||
                      0
                    ),
                  0
                )
              )}

            </strong>

          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon orange">

            <FileText
              size={22}
            />

          </div>

          <div>

            <span>
              Transactions
            </span>

            <strong>
              {purchases.length}
            </strong>

          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="purchase-card">

        <div className="purchase-card-header">

          <div>

            <h2>
              Purchase History
            </h2>

            <p>
              {purchases.length
                ? `${purchases.length} purchase(s) found.`
                : "No purchases available."
              }
            </p>

          </div>

          <div className="purchase-search">

            <Search size={18} />

            <input
              placeholder="Search purchase..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="purchase-table-wrapper">

          <table className="purchase-table">

            <thead>

              <tr>

                <th>
                  PURCHASE ID
                </th>

                <th>
                  SUPPLIER
                </th>

                <th>
                  SUPPLIER INVOICE
                </th>

                <th>
                  DATE
                </th>

                <th>
                  ITEMS
                </th>

                <th>
                  AMOUNT
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  ACTION
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="empty-row"
                  >
                    Loading purchases...
                  </td>

                </tr>

              ) : purchases.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="empty-row"
                  >

                    <ShoppingBag
                      size={42}
                    />

                    <strong>
                      No purchases found
                    </strong>

                    <span>
                      Purchase records will
                      appear here after you
                      create a purchase.
                    </span>

                  </td>

                </tr>

              ) : (

                purchases.map(
                  (purchase) => (

                    <tr
                      key={
                        purchase.PurchaseID
                      }
                    >

                      <td>

                        <span className="purchase-number">

                          {purchase.PurchaseNumber}

                        </span>

                      </td>

                      <td>

                        <strong>

                          {purchase.SupplierName ||
                            purchase.ManualSupplierName ||
                            "Manual Supplier"
                          }

                        </strong>

                      </td>

                      <td>

                        {
                          purchase.SupplierInvoiceNumber ||
                          "-"
                        }

                      </td>

                      <td>

                        {formatDate(
                          purchase.PurchaseDate
                        )}

                      </td>

                      <td>

                        {
                          purchase.ItemCount ||
                          0
                        }

                      </td>

                      <td>

                        <strong>

                          {currency(
                            purchase.GrandTotal
                          )}

                        </strong>

                      </td>

                      <td>

                        <span
                          className={
                            String(
                              purchase.PaymentStatus ||
                              ""
                            ).toLowerCase() ===
                            "received"
                              ? "status received"
                              : "status pending"
                          }
                        >

                          {
                            purchase.PaymentStatus ||
                            "Pending"
                          }

                        </span>

                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="action-button"
                            title="View"
                            onClick={() =>
                              handleView(
                                purchase
                              )
                            }
                          >

                            <Eye size={16} />

                          </button>

                          <button
                            className="action-button"
                            title="Edit"
                            onClick={() =>
                              alert(
                                "Edit feature will be added next."
                              )
                            }
                          >

                            <Pencil size={16} />

                          </button>

                          <button
                            className="action-button delete"
                            title="Delete"
                            onClick={() =>
                              handleDelete(
                                purchase
                              )
                            }
                          >

                            <Trash2 size={16} />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          ADD PURCHASE MODAL
      ===================================================== */}

      {showAddPurchase && (

        <div
          className="purchase-modal-overlay"
          onClick={
            closeAddPurchase
          }
        >

          <div
            className="purchase-add-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="purchase-modal-header">

              <div>

                <h2>
                  Add Purchase
                </h2>

                <p>
                  Create supplier purchase
                  transaction
                </p>

              </div>

              <button
                onClick={
                  closeAddPurchase
                }
              >
                <X size={20} />
              </button>

            </div>

            {/* MODE */}

            <div className="purchase-mode-switch">

              <button
                className={
                  purchaseMode ===
                  "single"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPurchaseMode(
                    "single"
                  )
                }
                type="button"
              >
                Single Purchase
              </button>

              <button
                className={
                  purchaseMode ===
                  "bulk"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPurchaseMode(
                    "bulk"
                  )
                }
                type="button"
              >
                Bulk Purchase
              </button>

            </div>

            <form
              className="purchase-form"
              onSubmit={
                handleCreate
              }
            >

              {formError && (

                <div className="purchase-form-error">
                  {formError}
                </div>

              )}

              {/* SUPPLIER */}

              <div className="form-section">

                <div className="form-section-heading">

                  <div>

                    <h3>
                      Supplier Details
                    </h3>

                    <p>
                      Select existing supplier
                      or enter manually
                    </p>

                  </div>

                </div>

                <div className="entry-toggle">

                  <button
                    type="button"
                    className={
                      supplierMode ===
                      "existing"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSupplierMode(
                        "existing"
                      )
                    }
                  >

                    Existing Supplier

                  </button>

                  <button
                    type="button"
                    className={
                      supplierMode ===
                      "manual"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSupplierMode(
                        "manual"
                      )
                    }
                  >

                    <UserPlus
                      size={15}
                    />

                    Manual Entry

                  </button>

                </div>

                <div className="purchase-form-grid">

                  <div className="purchase-form-group">

                    <label>
                      Supplier *
                    </label>

                    {supplierMode ===
                    "existing" ? (

                      <div className="purchase-select">

                        <select
                          value={
                            supplierId
                          }
                          onChange={(e) =>
                            setSupplierId(
                              e.target.value
                            )
                          }
                        >

                          <option value="">
                            Select Supplier
                          </option>

                          {suppliers.map(
                            (supplier) => (

                              <option
                                key={
                                  supplier.SupplierID
                                }
                                value={
                                  supplier.SupplierID
                                }
                              >

                                {
                                  supplier.SupplierName
                                }

                              </option>

                            )
                          )}

                        </select>

                        <ChevronDown
                          size={17}
                        />

                      </div>

                    ) : (

                      <div className="manual-input-wrap">

                        <UserPlus
                          size={17}
                        />

                        <input
                          type="text"
                          placeholder="Enter supplier name"
                          value={
                            manualSupplierName
                          }
                          onChange={(e) =>
                            setManualSupplierName(
                              e.target.value
                            )
                          }
                        />

                      </div>

                    )}

                  </div>

                  <div className="purchase-form-group">

                    <label>
                      Purchase Date *
                    </label>

                    <input
                      type="date"
                      value={
                        purchaseDate
                      }
                      onChange={(e) =>
                        setPurchaseDate(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="purchase-form-group">

                    <label>
                      Supplier Invoice
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. INV-45821"
                      value={
                        supplierInvoice
                      }
                      onChange={(e) =>
                        setSupplierInvoice(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="purchase-form-group">

                    <label>
                      Payment Status
                    </label>

                    <div className="purchase-select">

                      <select
                        value={
                          paymentStatus
                        }
                        onChange={(e) =>
                          setPaymentStatus(
                            e.target.value
                          )
                        }
                      >

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Received">
                          Received
                        </option>

                      </select>

                      <ChevronDown
                        size={17}
                      />

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  SINGLE
              ================================================= */}

              {purchaseMode ===
                "single" && (

                <div className="form-section">

                  <div className="form-section-heading">

                    <div>

                      <h3>
                        Product Details
                      </h3>

                      <p>
                        Add product to this purchase
                      </p>

                    </div>

                  </div>

                  <div className="entry-toggle">

                    <button
                      type="button"
                      className={
                        singleProductMode ===
                        "existing"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setSingleProductMode(
                          "existing"
                        )
                      }
                    >

                      <Package
                        size={15}
                      />

                      Existing Product

                    </button>

                    <button
                      type="button"
                      className={
                        singleProductMode ===
                        "manual"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setSingleProductMode(
                          "manual"
                        )
                      }
                    >

                      <PackagePlus
                        size={15}
                      />

                      Manual Entry

                    </button>

                  </div>

                  <div className="single-product-grid">

                    <div className="purchase-form-group product-main-field">

                      <label>
                        Product *
                      </label>

                      {singleProductMode ===
                      "existing" ? (

                        <div className="purchase-select">

                          <select
                            value={
                              singleProductId
                            }
                            onChange={(e) =>
                              handleSingleProduct(
                                e.target.value
                              )
                            }
                          >

                            <option value="">
                              Select Product
                            </option>

                            {products.map(
                              (product) => (

                                <option
                                  key={
                                    product.ProductID
                                  }
                                  value={
                                    product.ProductID
                                  }
                                >

                                  {
                                    product.ProductName
                                  }

                                  {" • "}

                                  {
                                    product.ProductCode
                                  }

                                </option>

                              )
                            )}

                          </select>

                          <ChevronDown
                            size={17}
                          />

                        </div>

                      ) : (

                        <div className="manual-input-wrap">

                          <PackagePlus
                            size={17}
                          />

                          <input
                            type="text"
                            placeholder="Enter product name"
                            value={
                              manualSingleProductName
                            }
                            onChange={(e) =>
                              setManualSingleProductName(
                                e.target.value
                              )
                            }
                          />

                        </div>

                      )}

                    </div>

                    <div className="purchase-form-group">

                      <label>
                        Quantity *
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={
                          singleQuantity
                        }
                        onChange={(e) =>
                          setSingleQuantity(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="purchase-form-group">

                      <label>
                        Unit Price *
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          singleUnitPrice
                        }
                        onChange={(e) =>
                          setSingleUnitPrice(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="purchase-form-group">

                      <label>
                        GST %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={
                          singleGSTPercent
                        }
                        onChange={(e) =>
                          setSingleGSTPercent(
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  <div className="line-total-preview">

                    <span>
                      Item Total
                    </span>

                    <strong>
                      {currency(
                        singleSubtotal +
                          singleGST
                      )}
                    </strong>

                  </div>

                </div>

              )}

              {/* =================================================
                  BULK
              ================================================= */}

              {purchaseMode ===
                "bulk" && (

                <div className="form-section">

                  <div className="form-section-heading">

                    <div>

                      <h3>
                        Purchase Items
                      </h3>

                      <p>
                        Add multiple products
                        in one purchase
                      </p>

                    </div>

                    <button
                      type="button"
                      className="add-item-button"
                      onClick={
                        addBulkItem
                      }
                    >

                      <Plus size={16} />

                      Add Product

                    </button>

                  </div>

                  <div className="bulk-items-list">

                    {bulkItems.map(
                      (item, index) => (

                        <div
                          className="bulk-item-card"
                          key={index}
                        >

                          <div className="bulk-item-top">

                            <div className="bulk-item-number">

                              {index + 1}

                            </div>

                            <div>

                              <strong>
                                Product Item
                              </strong>

                              <span>
                                Purchase line #
                                {index + 1}
                              </span>

                            </div>

                            <button
                              type="button"
                              className="remove-item-button"
                              onClick={() =>
                                removeBulkItem(
                                  index
                                )
                              }
                              disabled={
                                bulkItems.length ===
                                1
                              }
                            >

                              <Trash2
                                size={16}
                              />

                            </button>

                          </div>

                          <div className="entry-toggle bulk-toggle">

                            <button
                              type="button"
                              className={
                                item.productMode ===
                                "existing"
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                updateBulkItem(
                                  index,
                                  "productMode",
                                  "existing"
                                )
                              }
                            >

                              Existing

                            </button>

                            <button
                              type="button"
                              className={
                                item.productMode ===
                                "manual"
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                updateBulkItem(
                                  index,
                                  "productMode",
                                  "manual"
                                )
                              }
                            >

                              Manual

                            </button>

                          </div>

                          <div className="bulk-item-grid">

                            <div className="purchase-form-group bulk-product-field">

                              <label>
                                Product *
                              </label>

                              {item.productMode ===
                              "existing" ? (

                                <div className="purchase-select">

                                  <select
                                    value={
                                      item.ProductID
                                    }
                                    onChange={(e) =>
                                      handleBulkProduct(
                                        index,
                                        e.target.value
                                      )
                                    }
                                  >

                                    <option value="">
                                      Select Product
                                    </option>

                                    {products.map(
                                      (product) => (

                                        <option
                                          key={
                                            product.ProductID
                                          }
                                          value={
                                            product.ProductID
                                          }
                                        >

                                          {
                                            product.ProductName
                                          }

                                          {" • "}

                                          {
                                            product.ProductCode
                                          }

                                        </option>

                                      )
                                    )}

                                  </select>

                                  <ChevronDown
                                    size={17}
                                  />

                                </div>

                              ) : (

                                <div className="manual-input-wrap">

                                  <PackagePlus
                                    size={16}
                                  />

                                  <input
                                    type="text"
                                    placeholder="Enter product name"
                                    value={
                                      item.ManualProductName
                                    }
                                    onChange={(e) =>
                                      updateBulkItem(
                                        index,
                                        "ManualProductName",
                                        e.target.value
                                      )
                                    }
                                  />

                                </div>

                              )}

                            </div>

                            <div className="purchase-form-group">

                              <label>
                                Qty
                              </label>

                              <input
                                type="number"
                                min="1"
                                value={
                                  item.Quantity
                                }
                                onChange={(e) =>
                                  updateBulkItem(
                                    index,
                                    "Quantity",
                                    e.target.value
                                  )
                                }
                              />

                            </div>

                            <div className="purchase-form-group">

                              <label>
                                Unit Price
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.UnitPrice
                                }
                                onChange={(e) =>
                                  updateBulkItem(
                                    index,
                                    "UnitPrice",
                                    e.target.value
                                  )
                                }
                              />

                            </div>

                            <div className="purchase-form-group">

                              <label>
                                GST %
                              </label>

                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  item.GSTPercent
                                }
                                onChange={(e) =>
                                  updateBulkItem(
                                    index,
                                    "GSTPercent",
                                    e.target.value
                                  )
                                }
                              />

                            </div>

                            <div className="bulk-line-total">

                              <span>
                                Total
                              </span>

                              <strong>

                                {currency(
                                  Number(
                                    item.Quantity ||
                                    0
                                  ) *
                                    Number(
                                      item.UnitPrice ||
                                      0
                                    ) *
                                    (
                                      1 +
                                      Number(
                                        item.GSTPercent ||
                                        0
                                      ) /
                                      100
                                    )
                                )}

                              </strong>

                            </div>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>

              )}

              {/* DISCOUNT */}

              <div className="purchase-form-grid">

                <div className="purchase-form-group">

                  <label>
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      discount
                    }
                    onChange={(e) =>
                      setDiscount(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="purchase-form-group">

                  <label>
                    Notes
                  </label>

                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={
                      notes
                    }
                    onChange={(e) =>
                      setNotes(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* TOTALS */}

              <div className="purchase-total-box">

                <div>

                  <span>
                    Subtotal
                  </span>

                  <strong>

                    {currency(
                      purchaseMode ===
                      "single"
                        ? singleSubtotal
                        : bulkTotals.subtotal
                    )}

                  </strong>

                </div>

                <div>

                  <span>
                    Discount
                  </span>

                  <strong>
                    -{" "}
                    {currency(
                      discount
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    GST
                  </span>

                  <strong>

                    {currency(
                      purchaseMode ===
                      "single"
                        ? singleGST
                        : bulkTotals.gst
                    )}

                  </strong>

                </div>

                <div className="grand-total">

                  <span>
                    Grand Total
                  </span>

                  <strong>

                    {currency(
                      purchaseMode ===
                      "single"
                        ? singleGrandTotal
                        : bulkTotals.grandTotal
                    )}

                  </strong>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="purchase-form-actions">

                <button
                  type="button"
                  className="purchase-cancel-button"
                  onClick={
                    closeAddPurchase
                  }
                  disabled={
                    formLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="purchase-save-button"
                  disabled={
                    formLoading
                  }
                >

                  {formLoading
                    ? "Saving..."
                    : "Save Purchase"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showView &&
        selectedPurchase && (

        <div
          className="purchase-modal-overlay"
          onClick={() =>
            setShowView(false)
          }
        >

          <div
            className="purchase-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="purchase-modal-header">

              <div>

                <h2>
                  Purchase Details
                </h2>

                <p>
                  {
                    selectedPurchase.PurchaseNumber
                  }
                </p>

              </div>

              <button
                onClick={() =>
                  setShowView(false)
                }
              >

                <X size={20} />

              </button>

            </div>

            <div className="purchase-details">

              <div>

                <span>
                  Supplier
                </span>

                <strong>

                  {
                    selectedPurchase.SupplierName ||
                    selectedPurchase.ManualSupplierName ||
                    "Manual Supplier"
                  }

                </strong>

              </div>

              <div>

                <span>
                  Supplier Invoice
                </span>

                <strong>

                  {
                    selectedPurchase.SupplierInvoiceNumber ||
                    "-"
                  }

                </strong>

              </div>

              <div>

                <span>
                  Purchase Date
                </span>

                <strong>

                  {formatDate(
                    selectedPurchase.PurchaseDate
                  )}

                </strong>

              </div>

              <div>

                <span>
                  Grand Total
                </span>

                <strong>

                  {currency(
                    selectedPurchase.GrandTotal
                  )}

                </strong>

              </div>

              <div>

                <span>
                  GST
                </span>

                <strong>

                  {currency(
                    selectedPurchase.GSTAmount
                  )}

                </strong>

              </div>

              <div>

                <span>
                  Payment Status
                </span>

                <strong>

                  {
                    selectedPurchase.PaymentStatus
                  }

                </strong>

              </div>

            </div>

            <div className="view-purchase-items">

              <h3>
                Purchased Items
              </h3>

              <div className="view-items-list">

                {selectedItems.map(
                  (item) => (

                    <div
                      className="view-item-row"
                      key={
                        item.PurchaseItemID
                      }
                    >

                      <div>

                        <strong>

                          {
                            item.ProductName ||
                            item.ManualProductName ||
                            "Manual Product"
                          }

                        </strong>

                        <span>

                          {
                            item.ProductCode ||
                            "Manual Entry"
                          }

                        </span>

                      </div>

                      <div>
                        Qty:{" "}
                        {item.Quantity}
                      </div>

                      <div>
                        Unit:{" "}
                        {currency(
                          item.UnitPrice
                        )}
                      </div>

                      <div>
                        GST:{" "}
                        {
                          item.GSTPercent
                        }%
                      </div>

                      <strong>

                        {currency(
                          item.TotalAmount
                        )}

                      </strong>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Purchases;