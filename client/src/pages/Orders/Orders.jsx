import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ShoppingBag,
  Plus,
  Search,
  X,
  Loader2,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  UserRound,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  Clock3,
  PackageCheck,
} from "lucide-react";

import "./Orders.css";

const API = "http://localhost:5000/api/orders";

const emptyForm = {
  CustomerID: "",
  OrderType: "Complete Glasses",
  Status: "Pending",
  TotalAmount: "",
  AdvanceAmount: "",
  Notes: "",
};

function Orders() {
  // =====================================================
  // BASIC STATE
  // =====================================================

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // =====================================================
  // FORM STATE
  // =====================================================

  const [form, setForm] = useState(emptyForm);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [editingId, setEditingId] =
    useState(null);

  // =====================================================
  // UI STATE
  // =====================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load orders."
        );
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (err) {
      console.error(
        "Load Orders Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD FORM DATA
  // =====================================================

  const loadFormData = async () => {
    try {
      const response = await fetch(
        `${API}/form-data`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load order form data."
        );
      }

      setCustomers(
        Array.isArray(data.customers)
          ? data.customers
          : []
      );

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );
    } catch (err) {
      console.error(
        "Order Form Data Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load customers and products."
      );
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadOrders();
    loadFormData();
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (order) => {
    setEditingId(order.OrderID);

    setForm({
      CustomerID:
        order.CustomerID || "",

      OrderType:
        order.OrderType ||
        "Complete Glasses",

      Status:
        order.Status ||
        "Pending",

      TotalAmount:
        order.TotalAmount ?? "",

      AdvanceAmount:
        order.AdvanceAmount ?? "",

      Notes:
        order.Notes || "",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =====================================================
  // CLOSE FORM MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingId(null);

    setForm({
      ...emptyForm,
    });
  };

  // =====================================================
  // VIEW ORDER
  // =====================================================

  const viewOrder = async (order) => {
    try {
      setError("");

      const response = await fetch(
        `${API}/${order.OrderID}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load order details."
        );
      }

      setSelectedOrder(
        data.order || order
      );

      setShowViewModal(true);
    } catch (err) {
      console.error(
        "View Order Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load order details."
      );
    }
  };

  // =====================================================
  // SAVE ORDER
  // =====================================================

  const saveOrder = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.CustomerID) {
      setError(
        "Please select a customer."
      );

      return;
    }

    if (
      Number(form.TotalAmount) <= 0
    ) {
      setError(
        "Total amount must be greater than zero."
      );

      return;
    }

    const advance =
      Number(form.AdvanceAmount) || 0;

    const total =
      Number(form.TotalAmount) || 0;

    if (advance > total) {
      setError(
        "Advance amount cannot be greater than total amount."
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        CustomerID:
          Number(form.CustomerID),

        OrderType:
          form.OrderType,

        Status:
          form.Status,

        TotalAmount:
          total,

        AdvanceAmount:
          advance,

        Notes:
          form.Notes.trim(),
      };

      const url = editingId
        ? `${API}/${editingId}`
        : API;

      const method = editingId
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
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
            "Unable to save order."
        );
      }

      setSuccess(
        editingId
          ? "Order updated successfully."
          : `Order ${
              data.order?.OrderNumber ||
              data.orderNumber ||
              ""
            } created successfully.`
      );

      closeModal();

      await loadOrders();
    } catch (err) {
      console.error(
        "Save Order Error:",
        err
      );

      setError(
        err.message ||
          "Unable to save order."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE ORDER
  // =====================================================

  const deleteOrder = async (order) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete order ${
          order.OrderNumber ||
          `#${order.OrderID}`
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API}/${order.OrderID}`,
        {
          method: "DELETE",
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
            "Unable to delete order."
        );
      }

      setSuccess(
        "Order deleted successfully."
      );

      await loadOrders();
    } catch (err) {
      console.error(
        "Delete Order Error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete order."
      );
    }
  };

  // =====================================================
  // FILTER ORDERS
  // =====================================================

  const filteredOrders = useMemo(() => {
    const searchValue =
      search
        .trim()
        .toLowerCase();

    return orders.filter(
      (order) => {
        const orderNumber =
          String(
            order.OrderNumber || ""
          ).toLowerCase();

        const customerName =
          String(
            order.CustomerName || ""
          ).toLowerCase();

        const customerPhone =
          String(
            order.CustomerPhone || ""
          ).toLowerCase();

        const status =
          String(
            order.Status || ""
          ).toLowerCase();

        const matchesSearch =
          !searchValue ||
          orderNumber.includes(
            searchValue
          ) ||
          customerName.includes(
            searchValue
          ) ||
          customerPhone.includes(
            searchValue
          ) ||
          status.includes(
            searchValue
          );

        const matchesStatus =
          statusFilter === "All" ||
          String(
            order.Status || ""
          ).toLowerCase() ===
            statusFilter.toLowerCase();

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    orders,
    search,
    statusFilter,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const totalOrders =
      orders.length;

    const pending =
      orders.filter(
        (order) =>
          String(
            order.Status || ""
          ).toLowerCase() ===
          "pending"
      ).length;

    const confirmed =
      orders.filter(
        (order) =>
          String(
            order.Status || ""
          ).toLowerCase() ===
          "confirmed"
      ).length;

    const completed =
      orders.filter(
        (order) =>
          String(
            order.Status || ""
          ).toLowerCase() ===
          "completed"
      ).length;

    const totalValue =
      orders.reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.TotalAmount || 0
          ),
        0
      );

    return {
      totalOrders,
      pending,
      confirmed,
      completed,
      totalValue,
    };
  }, [orders]);

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const money = (value) => {
    return Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
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

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
    status
  ) => {
    const value =
      String(
        status || ""
      ).toLowerCase();

    if (
      value === "completed"
    ) {
      return "completed";
    }

    if (
      value === "confirmed"
    ) {
      return "confirmed";
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "cancelled";
    }

    return "pending";
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="orders-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="orders-page-header">

        <div>
          <div className="orders-title-row">
            <div className="orders-title-icon">
              <ShoppingBag
                size={22}
              />
            </div>

            <div>
              <h1>
                Orders
              </h1>

              <p>
                Manage customer orders,
                payments and order status.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="orders-primary-btn"
          onClick={openAddModal}
        >
          <Plus size={17} />
          New Order
        </button>

      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="orders-alert error">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="orders-alert success">
          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="orders-summary-grid">

        <div className="orders-summary-card">
          <div className="summary-icon blue">
            <ShoppingBag
              size={19}
            />
          </div>

          <div>
            <span>
              Total Orders
            </span>

            <strong>
              {summary.totalOrders}
            </strong>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-icon orange">
            <Clock3
              size={19}
            />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {summary.pending}
            </strong>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-icon green">
            <CheckCircle2
              size={19}
            />
          </div>

          <div>
            <span>
              Confirmed
            </span>

            <strong>
              {summary.confirmed}
            </strong>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-icon purple">
            <PackageCheck
              size={19}
            />
          </div>

          <div>
            <span>
              Completed
            </span>

            <strong>
              {summary.completed}
            </strong>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-icon teal">
            <IndianRupee
              size={19}
            />
          </div>

          <div>
            <span>
              Order Value
            </span>

            <strong>
              ₹{money(
                summary.totalValue
              )}
            </strong>
          </div>
        </div>

      </div>

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div className="orders-content-card">

        <div className="orders-toolbar">

          <div>
            <h2>
              Order History
            </h2>

            <span>
              {filteredOrders.length}
              {" "}
              order
              {filteredOrders.length === 1
                ? ""
                : "s"}
              {" "}
              found
            </span>
          </div>

          <div className="orders-toolbar-actions">

            <div className="orders-search-box">

              <Search
                size={17}
              />

              <input
                type="text"
                placeholder="Search order, customer..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  <X size={14} />
                </button>
              )}

            </div>

            <select
              className="orders-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Confirmed">
                Confirmed
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>

            <button
              type="button"
              className="orders-refresh-btn"
              onClick={() => {
                loadOrders();
                loadFormData();
              }}
              title="Refresh"
            >
              <RefreshCw
                size={16}
              />
            </button>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="orders-loading">
            <Loader2
              size={30}
              className="orders-spin"
            />

            <p>
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length ===
          0 ? (

          <div className="orders-empty">

            <ShoppingBag
              size={42}
            />

            <h3>
              No orders found
            </h3>

            <p>
              {search ||
              statusFilter !== "All"
                ? "Try changing your search or filter."
                : "Create your first customer order."}
            </p>

            {!search &&
              statusFilter ===
                "All" && (
                <button
                  type="button"
                  onClick={
                    openAddModal
                  }
                >
                  <Plus
                    size={16}
                  />
                  Create Order
                </button>
              )}

          </div>

        ) : (

          <div className="orders-table-wrapper">

            <table className="orders-table">

              <thead>
                <tr>
                  <th>
                    ORDER
                  </th>

                  <th>
                    CUSTOMER
                  </th>

                  <th>
                    DATE
                  </th>

                  <th>
                    TYPE
                  </th>

                  <th>
                    TOTAL
                  </th>

                  <th>
                    ADVANCE
                  </th>

                  <th>
                    BALANCE
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

                {filteredOrders.map(
                  (order) => {

                    const total =
                      Number(
                        order.TotalAmount ||
                          0
                      );

                    const advance =
                      Number(
                        order.AdvanceAmount ||
                          0
                      );

                    const balance =
                      Number(
                        order.BalanceAmount ??
                          total -
                            advance
                      );

                    return (
                      <tr
                        key={
                          order.OrderID
                        }
                      >

                        <td>
                          <div className="order-number-cell">

                            <strong>
                              {order.OrderNumber ||
                                `ORD-${order.OrderID}`}
                            </strong>

                            <span>
                              #{order.OrderID}
                            </span>

                          </div>
                        </td>

                        <td>
                          <div className="order-customer-cell">

                            <div className="customer-avatar">
                              <UserRound
                                size={15}
                              />
                            </div>

                            <div>
                              <strong>
                                {order.CustomerName ||
                                  `Customer #${order.CustomerID}`}
                              </strong>

                              <span>
                                {order.CustomerPhone ||
                                  "-"}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          <div className="order-date-cell">
                            <CalendarDays
                              size={14}
                            />

                            <span>
                              {formatDate(
                                order.OrderDate
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="order-type">
                            {order.OrderType ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          <strong className="amount-total">
                            ₹{money(total)}
                          </strong>
                        </td>

                        <td>
                          <span className="amount-advance">
                            ₹{money(
                              advance
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="amount-balance">
                            ₹{money(
                              balance
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`order-status ${getStatusClass(
                              order.Status
                            )}`}
                          >
                            {order.Status ||
                              "Pending"}
                          </span>
                        </td>

                        <td>

                          <div className="order-actions">

                            <button
                              type="button"
                              className="view"
                              title="View"
                              onClick={() =>
                                viewOrder(
                                  order
                                )
                              }
                            >
                              <Eye
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="edit"
                              title="Edit"
                              onClick={() =>
                                openEditModal(
                                  order
                                )
                              }
                            >
                              <Pencil
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="delete"
                              title="Delete"
                              onClick={() =>
                                deleteOrder(
                                  order
                                )
                              }
                            >
                              <Trash2
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

        )}

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (
        <div
          className="orders-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="orders-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="orders-modal-header">

              <div>
                <h2>
                  {editingId
                    ? "Edit Order"
                    : "Create New Order"}
                </h2>

                <span>
                  {editingId
                    ? "Update order information."
                    : "Enter customer and order details."}
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={19} />
              </button>

            </div>

            <form
              className="orders-form"
              onSubmit={saveOrder}
            >

              <div className="orders-form-section">

                <div className="orders-section-title">
                  <UserRound
                    size={17}
                  />

                  <div>
                    <h3>
                      Customer
                    </h3>

                    <span>
                      Select customer for this order.
                    </span>
                  </div>
                </div>

                <div className="orders-form-grid">

                  <div className="orders-form-group full">

                    <label>
                      Customer
                      <span>*</span>
                    </label>

                    <select
                      name="CustomerID"
                      value={
                        form.CustomerID
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >
                      <option value="">
                        Select Customer
                      </option>

                      {customers.map(
                        (customer) => (
                          <option
                            key={
                              customer.CustomerID
                            }
                            value={
                              customer.CustomerID
                            }
                          >
                            {customer.FullName ||
                              customer.CustomerName ||
                              `Customer #${customer.CustomerID}`}
                            {" - "}
                            {customer.Phone ||
                              ""}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

              </div>

              <div className="orders-form-section">

                <div className="orders-section-title">
                  <ShoppingBag
                    size={17}
                  />

                  <div>
                    <h3>
                      Order Details
                    </h3>

                    <span>
                      Enter order type and payment information.
                    </span>
                  </div>
                </div>

                <div className="orders-form-grid">

                  <div className="orders-form-group">

                    <label>
                      Order Type
                    </label>

                    <select
                      name="OrderType"
                      value={
                        form.OrderType
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Complete Glasses">
                        Complete Glasses
                      </option>

                      <option value="Frame">
                        Frame
                      </option>

                      <option value="Lenses">
                        Lenses
                      </option>

                      <option value="Sunglasses">
                        Sunglasses
                      </option>

                      <option value="Contact Lenses">
                        Contact Lenses
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                  </div>

                  <div className="orders-form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="Status"
                      value={
                        form.Status
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Confirmed">
                        Confirmed
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </select>

                  </div>

                  <div className="orders-form-group">

                    <label>
                      Total Amount
                      <span>*</span>
                    </label>

                    <div className="orders-input-icon">

                      <IndianRupee
                        size={15}
                      />

                      <input
                        type="number"
                        name="TotalAmount"
                        value={
                          form.TotalAmount
                        }
                        onChange={
                          handleChange
                        }
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />

                    </div>

                  </div>

                  <div className="orders-form-group">

                    <label>
                      Advance Amount
                    </label>

                    <div className="orders-input-icon">

                      <IndianRupee
                        size={15}
                      />

                      <input
                        type="number"
                        name="AdvanceAmount"
                        value={
                          form.AdvanceAmount
                        }
                        onChange={
                          handleChange
                        }
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />

                    </div>

                  </div>

                  <div className="orders-form-group full">

                    <label>
                      Notes
                    </label>

                    <textarea
                      name="Notes"
                      value={
                        form.Notes
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                      placeholder="Enter order notes..."
                    />

                  </div>

                </div>

              </div>

              {/* BALANCE PREVIEW */}

              <div className="orders-payment-preview">

                <div>
                  <span>
                    Total
                  </span>

                  <strong>
                    ₹{money(
                      form.TotalAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Advance
                  </span>

                  <strong>
                    ₹{money(
                      form.AdvanceAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Balance
                  </span>

                  <strong>
                    ₹{money(
                      Math.max(
                        Number(
                          form.TotalAmount ||
                            0
                        ) -
                          Number(
                            form.AdvanceAmount ||
                              0
                          ),
                        0
                      )
                    )}
                  </strong>
                </div>

              </div>

              <div className="orders-modal-footer">

                <button
                  type="button"
                  className="orders-secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="orders-primary-btn"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="orders-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={17}
                      />

                      {editingId
                        ? "Update Order"
                        : "Create Order"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {showViewModal &&
        selectedOrder && (
          <div
            className="orders-modal-overlay"
            onClick={() =>
              setShowViewModal(false)
            }
          >

            <div
              className="orders-view-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="orders-modal-header">

                <div>
                  <h2>
                    Order Details
                  </h2>

                  <span>
                    {selectedOrder.OrderNumber ||
                      `Order #${selectedOrder.OrderID}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  <X size={19} />
                </button>

              </div>

              <div className="orders-view-content">

                <div className="orders-view-grid">

                  <div>
                    <span>
                      Order Number
                    </span>

                    <strong>
                      {selectedOrder.OrderNumber ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Customer
                    </span>

                    <strong>
                      {selectedOrder.CustomerName ||
                        `Customer #${selectedOrder.CustomerID}`}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {selectedOrder.CustomerPhone ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Order Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedOrder.OrderDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Order Type
                    </span>

                    <strong>
                      {selectedOrder.OrderType ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      <span
                        className={`order-status ${getStatusClass(
                          selectedOrder.Status
                        )}`}
                      >
                        {selectedOrder.Status ||
                          "Pending"}
                      </span>
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Amount
                    </span>

                    <strong>
                      ₹{money(
                        selectedOrder.TotalAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Advance
                    </span>

                    <strong>
                      ₹{money(
                        selectedOrder.AdvanceAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Balance
                    </span>

                    <strong>
                      ₹{money(
                        selectedOrder.BalanceAmount
                      )}
                    </strong>
                  </div>

                </div>

                {selectedOrder.Notes && (
                  <div className="orders-notes-box">

                    <span>
                      Notes
                    </span>

                    <p>
                      {selectedOrder.Notes}
                    </p>

                  </div>
                )}

                {Array.isArray(
                  selectedOrder.items
                ) &&
                  selectedOrder.items
                    .length > 0 && (
                    <div className="orders-items-section">

                      <h3>
                        Order Items
                      </h3>

                      <div className="orders-items-table-wrapper">

                        <table className="orders-items-table">

                          <thead>
                            <tr>
                              <th>
                                PRODUCT
                              </th>

                              <th>
                                QUANTITY
                              </th>

                              <th>
                                UNIT PRICE
                              </th>

                              <th>
                                TOTAL
                              </th>
                            </tr>
                          </thead>

                          <tbody>

                            {selectedOrder.items.map(
                              (
                                item,
                                index
                              ) => (
                                <tr
                                  key={
                                    item.OrderItemID ||
                                    index
                                  }
                                >
                                  <td>
                                    {item.ProductName ||
                                      item.Name ||
                                      `Product #${item.ProductID}`}
                                  </td>

                                  <td>
                                    {item.Quantity}
                                  </td>

                                  <td>
                                    ₹{money(
                                      item.UnitPrice
                                    )}
                                  </td>

                                  <td>
                                    ₹{money(
                                      item.TotalAmount
                                    )}
                                  </td>
                                </tr>
                              )
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>
                  )}

              </div>

              <div className="orders-modal-footer">

                <button
                  type="button"
                  className="orders-secondary-btn"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="orders-primary-btn"
                  onClick={() => {
                    setShowViewModal(
                      false
                    );

                    openEditModal(
                      selectedOrder
                    );
                  }}
                >
                  <Pencil
                    size={16}
                  />

                  Edit Order
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Orders;