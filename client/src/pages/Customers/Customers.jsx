import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Eye,
  Pencil,
  Trash2,
  X,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

import "./Customers.css";

const API = "http://localhost:5000/api/customers";

const EMPTY_FORM = {
  FullName: "",
  Phone: "",
  Gender: "",
};

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [summary, setSummary] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    eyeTests: 0,
  });

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [modal, setModal] = useState(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [form, setForm] =
    useState({ ...EMPTY_FORM });

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const url = search.trim()
        ? `${API}?search=${encodeURIComponent(
            search.trim()
          )}`
        : API;

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load customers."
        );
      }

      setCustomers(
        Array.isArray(data.customers)
          ? data.customers
          : []
      );
    } catch (err) {
      console.error(
        "Load Customers Error:",
        err
      );

      setCustomers([]);

      setError(
        err.message ||
          "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD SUMMARY
  // =====================================================

  const loadSummary = async () => {
    try {
      const response =
        await fetch(
          `${API}/summary`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load summary."
        );
      }

      setSummary({
        totalCustomers:
          Number(
            data.summary?.totalCustomers ||
              0
          ),

        activeCustomers:
          Number(
            data.summary?.activeCustomers ||
              0
          ),

        eyeTests:
          Number(
            data.summary?.eyeTests ||
              0
          ),
      });
    } catch (err) {
      console.error(
        "Customer Summary Error:",
        err
      );
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const refreshPage = async () => {
    await Promise.all([
      loadCustomers(),
      loadSummary(),
    ]);
  };

  // =====================================================
  // INITIAL SUMMARY
  // =====================================================

  useEffect(() => {
    loadSummary();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadCustomers();
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [search]);

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
    setForm({
      ...EMPTY_FORM,
    });

    setSelectedCustomer(null);

    setModal("add");
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (
    customer
  ) => {
    setForm({
      FullName:
        customer.FullName || "",

      Phone:
        customer.Phone || "",

      Gender:
        customer.Gender || "",
    });

    setSelectedCustomer(
      customer
    );

    setModal("edit");
  };

  // =====================================================
  // VIEW CUSTOMER
  // =====================================================

  const openViewModal = async (
    customer
  ) => {
    try {
      setError("");

      const response =
        await fetch(
          `${API}/${customer.CustomerID}`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load customer."
        );
      }

      setSelectedCustomer({
        customer:
          data.customer ||
          customer,

        purchasedItems:
          Array.isArray(
            data.purchasedItems
          )
            ? data.purchasedItems
            : [],

        orders:
          Array.isArray(
            data.orders
          )
            ? data.orders
            : [],

        eyeTests:
          Array.isArray(
            data.eyeTests
          )
            ? data.eyeTests
            : [],

        Purchases:
          Number(
            data.Purchases || 0
          ),

        TotalSpent:
          Number(
            data.TotalSpent || 0
          ),
      });

      setModal("view");
    } catch (err) {
      console.error(
        "Open Customer Error:",
        err
      );

      alert(
        err.message ||
          "Unable to load customer."
      );
    }
  };

  // =====================================================
  // SAVE CUSTOMER
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const fullName =
      form.FullName.trim();

    const phone =
      form.Phone.trim();

    const gender =
      form.Gender.trim();

    if (
      !fullName ||
      !phone ||
      !gender
    ) {
      alert(
        "Full Name, Phone and Gender are required."
      );

      return;
    }

    try {
      setSaving(true);

      const isEdit =
        modal === "edit";

      const customerId =
        selectedCustomer?.CustomerID;

      const url = isEdit
        ? `${API}/${customerId}`
        : API;

      const response =
        await fetch(url, {
          method: isEdit
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            FullName:
              fullName,

            Phone:
              phone,

            Gender:
              gender,
          }),
        });

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save customer."
        );
      }

      if (isEdit) {
        alert(
          "Customer updated successfully."
        );
      } else {
        alert(
          `Customer added successfully.\n\nCustomer Code: ${
            data.customerCode ||
            "Auto Generated"
          }`
        );
      }

      closeModal();

      await refreshPage();
    } catch (err) {
      console.error(
        "Save Customer Error:",
        err
      );

      alert(
        err.message ||
          "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CUSTOMER
  // =====================================================

  const handleDelete = async (
    customer
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${customer.FullName}?\n\nCustomer Code: ${
          customer.CustomerCode ||
          "-"
        }`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/${customer.CustomerID}`,
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
            "Unable to delete customer."
        );
      }

      alert(
        data.message ||
          "Customer deleted successfully."
      );

      await refreshPage();
    } catch (err) {
      console.error(
        "Delete Customer Error:",
        err
      );

      alert(
        err.message ||
          "Unable to delete customer."
      );
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    setModal(null);

    setSelectedCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (
    amount
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(amount || 0)
    );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "-";
    }

    return parsed.toLocaleDateString(
      "en-IN"
    );
  };

  // =====================================================
  // INITIAL
  // =====================================================

  const getInitial = (
    name
  ) => {
    return String(
      name || "C"
    )
      .charAt(0)
      .toUpperCase();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="customers-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-top">

        <div>
          <h1>
            Customers
          </h1>

          <p>
            Manage customer records
            and purchase history.
          </p>
        </div>

        <div className="page-actions">

          <button
            type="button"
            className="refresh-btn"
            onClick={
              refreshPage
            }
            title="Refresh"
          >
            <RefreshCw
              size={16}
            />
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={
              openAddModal
            }
          >
            <UserPlus
              size={17}
            />

            Add Customer
          </button>

        </div>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="customer-summary">

        <div className="summary-card">

          <div className="summary-icon blue">
            <Users
              size={21}
            />
          </div>

          <div>
            <span>
              Total Customers
            </span>

            <strong>
              {summary.totalCustomers.toLocaleString()}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon green">
            <Phone
              size={21}
            />
          </div>

          <div>
            <span>
              Active Customers
            </span>

            <strong>
              {summary.activeCustomers.toLocaleString()}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon orange">
            <Eye
              size={21}
            />
          </div>

          <div>
            <span>
              Eye Tests
            </span>

            <strong>
              {summary.eyeTests.toLocaleString()}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          CUSTOMER LIST
      ================================================= */}

      <div className="content-card">

        <div className="table-toolbar">

          <div>
            <h2>
              Customer List
            </h2>

            <span>
              {customers.length}{" "}
              customer
              {customers.length === 1
                ? ""
                : "s"}{" "}
              found
            </span>
          </div>

          <div className="search-box">

            <Search
              size={17}
            />

            <input
              type="text"
              placeholder="Search name, phone, code..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="error-box">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                refreshPage
              }
            >
              Retry
            </button>

          </div>
        )}

        {/* LOADING */}

        {loading ? (

          <div className="table-state">
            <span>
              Loading customers...
            </span>
          </div>

        ) : customers.length ===
          0 ? (

          <div className="table-state">

            <Users
              size={38}
            />

            <strong>
              No customers found
            </strong>

            <span>
              Add your first customer
              to get started.
            </span>

            <button
              type="button"
              className="empty-add-btn"
              onClick={
                openAddModal
              }
            >
              <UserPlus
                size={15}
              />

              Add Customer
            </button>

          </div>

        ) : (

          <div className="responsive-table">

            <table>

              <thead>

                <tr>

                  <th>
                    CUSTOMER
                  </th>

                  <th>
                    PHONE
                  </th>

                  <th>
                    GENDER
                  </th>

                  <th>
                    PURCHASES
                  </th>

                  <th>
                    TOTAL SPENT
                  </th>

                  <th>
                    ACTION
                  </th>

                </tr>

              </thead>

              <tbody>

                {customers.map(
                  (customer) => (

                    <tr
                      key={
                        customer.CustomerID
                      }
                    >

                      <td>

                        <div className="customer-cell">

                          <div className="customer-avatar">

                            {getInitial(
                              customer.FullName
                            )}

                          </div>

                          <div>

                            <strong>
                              {
                                customer.FullName ||
                                "-"
                              }
                            </strong>

                            <small>
                              {
                                customer.CustomerCode ||
                                "-"
                              }
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>
                        {
                          customer.Phone ||
                          "-"
                        }
                      </td>

                      <td>

                        <span className="gender-badge">
                          {
                            customer.Gender ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>
                        {Number(
                          customer.Purchases ||
                            0
                        )}
                      </td>

                      <td className="amount">
                        {formatMoney(
                          customer.TotalSpent ||
                            0
                        )}
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            type="button"
                            title="View"
                            onClick={() =>
                              openViewModal(
                                customer
                              )
                            }
                          >
                            <Eye
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                customer
                              )
                            }
                          >
                            <Pencil
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() =>
                              handleDelete(
                                customer
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

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {(modal === "add" ||
        modal === "edit") && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >

          <div
            className="customer-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {modal === "add"
                    ? "Add Customer"
                    : "Edit Customer"}
                </h2>

                <span>
                  {modal === "add"
                    ? "Only essential customer information is required."
                    : "Update the customer's basic information."}
                </span>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
              >
                <X
                  size={19}
                />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* AUTO CUSTOMER CODE */}

              <div className="auto-code-box">

                <span>
                  Customer Code
                </span>

                <strong>
                  {modal === "edit"
                    ? selectedCustomer?.CustomerCode ||
                      "-"
                    : "Auto Generated"}
                </strong>

                <small>
                  {modal === "edit"
                    ? "Customer code cannot be changed."
                    : "The code will be generated automatically after saving."}
                </small>

              </div>

              <div className="form-grid">

                {/* FULL NAME */}

                <div className="form-group">

                  <label htmlFor="FullName">
                    Full Name *
                  </label>

                  <input
                    id="FullName"
                    name="FullName"
                    value={
                      form.FullName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter full name"
                    autoComplete="name"
                    required
                  />

                </div>

                {/* PHONE */}

                <div className="form-group">

                  <label htmlFor="Phone">
                    Phone *
                  </label>

                  <input
                    id="Phone"
                    name="Phone"
                    value={
                      form.Phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter phone number"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    required
                  />

                </div>

                {/* GENDER */}

                <div className="form-group full-width">

                  <label htmlFor="Gender">
                    Gender *
                  </label>

                  <select
                    id="Gender"
                    name="Gender"
                    value={
                      form.Gender
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : modal === "add"
                    ? "Add Customer"
                    : "Update Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW CUSTOMER
      ================================================= */}

      {modal === "view" &&
        selectedCustomer && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >

          <div
            className="customer-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Customer Details
                </h2>

                <span>
                  Customer profile and purchase history
                </span>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
              >
                <X
                  size={19}
                />
              </button>

            </div>

            {/* PROFILE */}

            <div className="customer-profile">

              <div className="big-avatar">

                {getInitial(
                  selectedCustomer
                    .customer
                    ?.FullName
                )}

              </div>

              <div>

                <h3>
                  {
                    selectedCustomer
                      .customer
                      ?.FullName ||
                    "Customer"
                  }
                </h3>

                <span>
                  {
                    selectedCustomer
                      .customer
                      ?.CustomerCode ||
                    "-"
                  }
                </span>

              </div>

            </div>

            {/* BASIC DETAILS */}

            <div className="detail-grid">

              <div>

                <Phone
                  size={16}
                />

                <span>
                  {
                    selectedCustomer
                      .customer
                      ?.Phone ||
                    "-"
                  }
                </span>

              </div>

              <div>

                <Users
                  size={16}
                />

                <span>
                  {
                    selectedCustomer
                      .customer
                      ?.Gender ||
                    "-"
                  }
                </span>

              </div>

            </div>

            {/* PURCHASE SUMMARY */}

            <div className="purchase-section">

              <div className="section-heading">

                <div>

                  <h3>
                    Purchase Summary
                  </h3>

                  <span>
                    Customer purchase overview
                  </span>

                </div>

                <ShoppingBag
                  size={20}
                />

              </div>

              <div className="detail-grid compact-detail-grid">

                <div>

                  <ShoppingBag
                    size={16}
                  />

                  <span>
                    Purchases:{" "}
                    <strong>
                      {Number(
                        selectedCustomer
                          .Purchases ||
                          0
                      )}
                    </strong>
                  </span>

                </div>

                <div>

                  <span>
                    Total Spent:{" "}
                    <strong>
                      {formatMoney(
                        selectedCustomer
                          .TotalSpent ||
                          0
                      )}
                    </strong>
                  </span>

                </div>

              </div>

            </div>

            {/* PURCHASED ITEMS */}

            <div className="purchase-section">

              <div className="section-heading">

                <div>

                  <h3>
                    Purchased Items
                  </h3>

                  <span>
                    Customer purchase history
                  </span>

                </div>

                <ShoppingBag
                  size={20}
                />

              </div>

              {
                selectedCustomer
                  .purchasedItems
                  .length === 0 ? (

                <div className="empty-purchases">
                  No purchased items found.
                </div>

              ) : (

                <div className="purchase-list">

                  {selectedCustomer
                    .purchasedItems
                    .map(
                      (item) => (

                        <div
                          className="purchase-item"
                          key={
                            item.OrderItemID
                          }
                        >

                          <div>

                            <strong>
                              {
                                item.ProductName ||
                                "Unknown Product"
                              }
                            </strong>

                            <span>
                              {
                                item.ProductCode ||
                                "-"
                              }
                            </span>

                            {item.OrderNumber && (
                              <small>
                                Order:{" "}
                                {
                                  item.OrderNumber
                                }
                              </small>
                            )}

                          </div>

                          <div>

                            <span>
                              Qty:{" "}
                              {
                                item.Quantity ||
                                0
                              }
                            </span>

                            <strong>
                              {formatMoney(
                                item.TotalAmount ||
                                  Number(
                                    item.UnitPrice ||
                                      0
                                  ) *
                                    Number(
                                      item.Quantity ||
                                        0
                                    )
                              )}
                            </strong>

                          </div>

                        </div>

                      )
                    )}

                </div>

              )}

            </div>

            {/* ORDERS */}

            <div className="purchase-section">

              <div className="section-heading">

                <div>

                  <h3>
                    Orders
                  </h3>

                  <span>
                    Customer order history
                  </span>

                </div>

              </div>

              {
                selectedCustomer
                  .orders
                  .length === 0 ? (

                <div className="empty-purchases">
                  No orders found.
                </div>

              ) : (

                <div className="order-list">

                  {selectedCustomer
                    .orders
                    .map(
                      (order) => (

                        <div
                          className="order-row"
                          key={
                            order.OrderID
                          }
                        >

                          <span>
                            {
                              order.OrderNumber ||
                              `Order #${order.OrderID}`
                            }
                          </span>

                          <span>
                            {formatDate(
                              order.OrderDate
                            )}
                          </span>

                          <strong>
                            {formatMoney(
                              order.TotalAmount
                            )}
                          </strong>

                        </div>

                      )
                    )}

                </div>

              )}

            </div>

            {/* EYE TESTS */}

            <div className="purchase-section">

              <div className="section-heading">

                <div>

                  <h3>
                    Eye Tests
                  </h3>

                  <span>
                    Customer eye testing history
                  </span>

                </div>

                <Eye
                  size={20}
                />

              </div>

              {
                selectedCustomer
                  .eyeTests
                  .length === 0 ? (

                <div className="empty-purchases">
                  No eye tests found.
                </div>

              ) : (

                <div className="order-list">

                  {selectedCustomer
                    .eyeTests
                    .map(
                      (test) => (

                        <div
                          className="order-row"
                          key={
                            test.EyeTestID
                          }
                        >

                          <span>
                            Test #
                            {
                              test.EyeTestID
                            }
                          </span>

                          <span>
                            {formatDate(
                              test.TestDate
                            )}
                          </span>

                          <strong>
                            {
                              test.Complaint ||
                              "Routine Checkup"
                            }
                          </strong>

                        </div>

                      )
                    )}

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Customers;