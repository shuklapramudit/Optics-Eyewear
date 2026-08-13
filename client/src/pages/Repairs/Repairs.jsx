import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Wrench,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  Loader2,
  UserRound,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  Clock3,
  PackageCheck,
} from "lucide-react";

import "./Repairs.css";

const API =
  "https://inventry-management-system-k9a5.onrender.com/api/repairs";

const emptyForm = {
  CustomerID: "",
  ItemType: "Frame",
  ItemDescription: "",
  ProblemDescription: "",
  EstimatedCost: "",
  AdvanceAmount: "",
  Status: "Pending",
  ExpectedDate: "",
  DeliveryDate: "",
  Notes: "",
};

function Repairs() {
  const [repairs, setRepairs] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [modal, setModal] =
    useState(null);

  const [selectedRepair, setSelectedRepair] =
    useState(null);

  const [editingId, setEditingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // =====================================================
  // LOAD REPAIRS
  // =====================================================

  const loadRepairs = async () => {
    try {
      setLoading(true);
      setError("");

      const url = search.trim()
        ? `${API}?search=${encodeURIComponent(
            search.trim()
          )}`
        : API;

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load repairs."
        );
      }

      setRepairs(
        Array.isArray(data.repairs)
          ? data.repairs
          : []
      );
    } catch (err) {
      console.error(
        "Load Repairs Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load repairs."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const loadCustomers = async () => {
    try {
      const response =
       await fetch(
  "https://inventry-management-system-k9a5.onrender.com/api/customers"
);

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setCustomers(
          Array.isArray(
            data.customers
          )
            ? data.customers
            : []
        );
      }
    } catch (err) {
      console.error(
        "Load Customers Error:",
        err
      );
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadRepairs();
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
  // OPEN ADD
  // =====================================================

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setMessage("");

    setModal("add");
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = (
    repair
  ) => {
    setEditingId(
      repair.RepairID
    );

    setForm({
      CustomerID:
        repair.CustomerID || "",

      ItemType:
        repair.ItemType ||
        "Frame",

      ItemDescription:
        repair.ItemDescription ||
        "",

      ProblemDescription:
        repair.ProblemDescription ||
        "",

      EstimatedCost:
        repair.EstimatedCost ??
        "",

      AdvanceAmount:
        repair.AdvanceAmount ??
        "",

      Status:
        repair.Status ||
        "Pending",

      ExpectedDate:
        repair.ExpectedDate
          ? String(
              repair.ExpectedDate
            ).substring(0, 10)
          : "",

      DeliveryDate:
        repair.DeliveryDate
          ? String(
              repair.DeliveryDate
            ).substring(0, 10)
          : "",

      Notes:
        repair.Notes || "",
    });

    setError("");
    setMessage("");

    setModal("edit");
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModal(null);
    setEditingId(null);

    setForm({
      ...emptyForm,
    });
  };

  // =====================================================
  // SAVE REPAIR
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.CustomerID) {
      setError(
        "Please select a customer."
      );
      return;
    }

    const estimated =
      Number(
        form.EstimatedCost || 0
      );

    const advance =
      Number(
        form.AdvanceAmount || 0
      );

    if (
      estimated < 0 ||
      advance < 0
    ) {
      setError(
        "Amount cannot be negative."
      );
      return;
    }

    if (advance > estimated) {
      setError(
        "Advance cannot be greater than estimated cost."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        CustomerID:
          Number(
            form.CustomerID
          ),

        ItemType:
          form.ItemType,

        ItemDescription:
          form.ItemDescription.trim(),

        ProblemDescription:
          form.ProblemDescription.trim(),

        EstimatedCost:
          estimated,

        AdvanceAmount:
          advance,

        Status:
          form.Status,

        ExpectedDate:
          form.ExpectedDate ||
          null,

        DeliveryDate:
          form.DeliveryDate ||
          null,

        Notes:
          form.Notes.trim(),
      };

      const url =
        editingId
          ? `${API}/${editingId}`
          : API;

      const method =
        editingId
          ? "PUT"
          : "POST";

      const response =
        await fetch(url, {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(
              payload
            ),
        });

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save repair."
        );
      }

      setMessage(
        data.message ||
          "Repair saved successfully."
      );

      closeModal();

      await loadRepairs();
    } catch (err) {
      console.error(
        "Save Repair Error:",
        err
      );

      setError(
        err.message ||
          "Unable to save repair."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // VIEW REPAIR
  // =====================================================

  const handleView = async (
    repair
  ) => {
    try {
      const response =
        await fetch(
          `${API}/${repair.RepairID}`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load repair."
        );
      }

      setSelectedRepair(
        data.repair
      );

      setModal("view");
    } catch (err) {
      setError(
        err.message ||
          "Unable to load repair."
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    repair
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${
          repair.RepairNumber ||
          `Repair #${repair.RepairID}`
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/${repair.RepairID}`,
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
            "Unable to delete repair."
        );
      }

      setMessage(
        data.message ||
          "Repair deleted successfully."
      );

      await loadRepairs();
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete repair."
      );
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredRepairs =
    useMemo(() => {
      return repairs.filter(
        (repair) => {
          if (
            statusFilter ===
            "All"
          ) {
            return true;
          }

          return (
            String(
              repair.Status || ""
            ).toLowerCase() ===
            statusFilter.toLowerCase()
          );
        }
      );
    }, [
      repairs,
      statusFilter,
    ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary =
    useMemo(() => {
      const pending =
        repairs.filter(
          (item) =>
            String(
              item.Status || ""
            ).toLowerCase() ===
            "pending"
        ).length;

      const inProgress =
        repairs.filter(
          (item) =>
            String(
              item.Status || ""
            ).toLowerCase() ===
            "in progress"
        ).length;

      const completed =
        repairs.filter(
          (item) =>
            String(
              item.Status || ""
            ).toLowerCase() ===
            "completed"
        ).length;

      const totalValue =
        repairs.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.EstimatedCost ||
                0
            ),
          0
        );

      return {
        total:
          repairs.length,
        pending,
        inProgress,
        completed,
        totalValue,
      };
    }, [repairs]);

  // =====================================================
  // HELPERS
  // =====================================================

  const money = (
    value
  ) =>
    Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  const formatDate = (
    value
  ) => {
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

  const statusClass = (
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
      value === "in progress"
    ) {
      return "progress";
    }

    if (
      value === "cancelled"
    ) {
      return "cancelled";
    }

    return "pending";
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="repairs-page">

      <div className="repairs-header">

        <div className="repairs-title">

          <div className="repairs-title-icon">
            <Wrench size={22} />
          </div>

          <div>
            <h1>
              Repairs
            </h1>

            <p>
              Manage eyewear repair
              jobs and customer repairs.
            </p>
          </div>

        </div>

        <div className="repairs-header-actions">

          <button
            type="button"
            className="repairs-refresh"
            onClick={loadRepairs}
          >
            <RefreshCw
              size={16}
            />
            Refresh
          </button>

          <button
            type="button"
            className="repairs-primary"
            onClick={
              openAddModal
            }
          >
            <Plus size={17} />
            New Repair
          </button>

        </div>

      </div>

      {error && (
        <div className="repairs-alert error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      {message && (
        <div className="repairs-alert success">
          <span>{message}</span>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="repairs-summary">

        <div className="repair-summary-card">
          <div className="repair-summary-icon blue">
            <Wrench size={20} />
          </div>

          <div>
            <span>
              Total Repairs
            </span>

            <strong>
              {summary.total}
            </strong>
          </div>
        </div>

        <div className="repair-summary-card">
          <div className="repair-summary-icon orange">
            <Clock3 size={20} />
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

        <div className="repair-summary-card">
          <div className="repair-summary-icon blue">
            <Wrench size={20} />
          </div>

          <div>
            <span>
              In Progress
            </span>

            <strong>
              {summary.inProgress}
            </strong>
          </div>
        </div>

        <div className="repair-summary-card">
          <div className="repair-summary-icon green">
            <CheckCircle2
              size={20}
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

        <div className="repair-summary-card">
          <div className="repair-summary-icon purple">
            <IndianRupee size={20} />
          </div>

          <div>
            <span>
              Estimated Value
            </span>

            <strong>
              ₹{money(
                summary.totalValue
              )}
            </strong>
          </div>
        </div>

      </div>

      <div className="repairs-card">

        <div className="repairs-toolbar">

          <div>
            <h2>
              Repair History
            </h2>

            <span>
              {filteredRepairs.length}
              {" "}
              repair records
            </span>
          </div>

          <div className="repairs-toolbar-actions">

            <div className="repairs-search">
              <Search size={16} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search repair, customer..."
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
              value={
                statusFilter
              }
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

              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>

          </div>

        </div>

        <div className="repairs-table-wrapper">

          <table className="repairs-table">

            <thead>
              <tr>
                <th>
                  REPAIR
                </th>

                <th>
                  CUSTOMER
                </th>

                <th>
                  ITEM
                </th>

                <th>
                  PROBLEM
                </th>

                <th>
                  DATE
                </th>

                <th>
                  COST
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

              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="repair-empty"
                  >
                    <Loader2
                      size={28}
                      className="repair-spin"
                    />

                    <span>
                      Loading repairs...
                    </span>
                  </td>
                </tr>
              ) : filteredRepairs.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="repair-empty"
                  >
                    <Wrench
                      size={40}
                    />

                    <strong>
                      No repairs found
                    </strong>

                    <span>
                      Create a new repair
                      to see it here.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredRepairs.map(
                  (repair) => {

                    const cost =
                      Number(
                        repair.EstimatedCost ||
                          0
                      );

                    const advance =
                      Number(
                        repair.AdvanceAmount ||
                          0
                      );

                    const balance =
                      Number(
                        repair.BalanceAmount ??
                          cost -
                            advance
                      );

                    return (
                      <tr
                        key={
                          repair.RepairID
                        }
                      >

                        <td>
                          <strong>
                            {repair.RepairNumber ||
                              `REP-${String(
                                repair.RepairID
                              ).padStart(
                                5,
                                "0"
                              )}`}
                          </strong>

                          <small>
                            #{repair.RepairID}
                          </small>
                        </td>

                        <td>
                          <div className="repair-customer">

                            <div className="repair-avatar">
                              <UserRound
                                size={15}
                              />
                            </div>

                            <div>
                              <strong>
                                {repair.CustomerName ||
                                  `Customer #${repair.CustomerID}`}
                              </strong>

                              <small>
                                {repair.CustomerPhone ||
                                  "-"}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="repair-item">
                            {repair.ItemType ||
                              "-"}
                          </span>

                          <small className="repair-item-description">
                            {repair.ItemDescription ||
                              "-"}
                          </small>
                        </td>

                        <td>
                          <span className="repair-problem">
                            {repair.ProblemDescription ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          <div className="repair-date">
                            <CalendarDays
                              size={14}
                            />

                            {formatDate(
                              repair.RepairDate
                            )}
                          </div>
                        </td>

                        <td>
                          <strong>
                            ₹{money(cost)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              balance >
                              0
                                ? "repair-balance due"
                                : "repair-balance paid"
                            }
                          >
                            ₹{money(
                              balance
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`repair-status ${statusClass(
                              repair.Status
                            )}`}
                          >
                            {repair.Status ||
                              "Pending"}
                          </span>
                        </td>

                        <td>

                          <div className="repair-actions">

                            <button
                              type="button"
                              title="View"
                              onClick={() =>
                                handleView(
                                  repair
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
                                  repair
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
                                handleDelete(
                                  repair
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
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {(modal === "add" ||
        modal === "edit") && (
        <div
          className="repair-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="repair-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="repair-modal-header">

              <div>
                <h2>
                  {modal === "edit"
                    ? "Edit Repair"
                    : "New Repair"}
                </h2>

                <span>
                  Enter customer and repair details.
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="repair-form">

                <div className="repair-form-grid">

                  <div className="repair-field full">

                    <label>
                      Customer *
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
                        (
                          customer
                        ) => (
                          <option
                            key={
                              customer.CustomerID
                            }
                            value={
                              customer.CustomerID
                            }
                          >
                            {customer.FullName ||
                              customer.CustomerName}
                            {" - "}
                            {customer.Phone ||
                              ""}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="repair-field">

                    <label>
                      Item Type
                    </label>

                    <select
                      name="ItemType"
                      value={
                        form.ItemType
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Frame">
                        Frame
                      </option>

                      <option value="Lens">
                        Lens
                      </option>

                      <option value="Sunglasses">
                        Sunglasses
                      </option>

                      <option value="Complete Glasses">
                        Complete Glasses
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                  </div>

                  <div className="repair-field">

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

                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </select>

                  </div>

                  <div className="repair-field full">

                    <label>
                      Item Description
                    </label>

                    <input
                      name="ItemDescription"
                      value={
                        form.ItemDescription
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Frame model, lens details, colour etc."
                    />

                  </div>

                  <div className="repair-field full">

                    <label>
                      Problem Description
                    </label>

                    <textarea
                      name="ProblemDescription"
                      value={
                        form.ProblemDescription
                      }
                      onChange={
                        handleChange
                      }
                      rows="3"
                      placeholder="Describe the repair problem..."
                    />

                  </div>

                  <div className="repair-field">

                    <label>
                      Estimated Cost
                    </label>

                    <div className="repair-money-input">

                      <IndianRupee
                        size={15}
                      />

                      <input
                        type="number"
                        name="EstimatedCost"
                        value={
                          form.EstimatedCost
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

                  <div className="repair-field">

                    <label>
                      Advance
                    </label>

                    <div className="repair-money-input">

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

                  <div className="repair-field">

                    <label>
                      Expected Date
                    </label>

                    <input
                      type="date"
                      name="ExpectedDate"
                      value={
                        form.ExpectedDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="repair-field">

                    <label>
                      Delivery Date
                    </label>

                    <input
                      type="date"
                      name="DeliveryDate"
                      value={
                        form.DeliveryDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="repair-field full">

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
                      rows="3"
                      placeholder="Additional notes..."
                    />

                  </div>

                </div>

                <div className="repair-payment-preview">

                  <div>
                    <span>
                      Estimated
                    </span>

                    <strong>
                      ₹{money(
                        form.EstimatedCost
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
                            form.EstimatedCost ||
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

              </div>

              <div className="repair-modal-footer">

                <button
                  type="button"
                  className="repair-cancel"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="repairs-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="repair-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={16}
                      />
                      {modal === "edit"
                        ? "Update Repair"
                        : "Create Repair"}
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

      {modal === "view" &&
        selectedRepair && (
          <div
            className="repair-modal-overlay"
            onClick={() =>
              setModal(null)
            }
          >

            <div
              className="repair-view-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="repair-modal-header">

                <div>
                  <h2>
                    Repair Details
                  </h2>

                  <span>
                    {selectedRepair.RepairNumber ||
                      `REP-${selectedRepair.RepairID}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  <X size={19} />
                </button>

              </div>

              <div className="repair-view-content">

                <div className="repair-view-grid">

                  <div>
                    <span>
                      Customer
                    </span>

                    <strong>
                      {selectedRepair.CustomerName ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {selectedRepair.CustomerPhone ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Item Type
                    </span>

                    <strong>
                      {selectedRepair.ItemType ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Repair Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedRepair.RepairDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Expected Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedRepair.ExpectedDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {selectedRepair.Status ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Estimated Cost
                    </span>

                    <strong>
                      ₹{money(
                        selectedRepair.EstimatedCost
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Advance
                    </span>

                    <strong>
                      ₹{money(
                        selectedRepair.AdvanceAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Balance
                    </span>

                    <strong>
                      ₹{money(
                        selectedRepair.BalanceAmount
                      )}
                    </strong>
                  </div>

                </div>

                <div className="repair-view-description">

                  <div>
                    <span>
                      Item Description
                    </span>

                    <p>
                      {selectedRepair.ItemDescription ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <span>
                      Problem
                    </span>

                    <p>
                      {selectedRepair.ProblemDescription ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <span>
                      Notes
                    </span>

                    <p>
                      {selectedRepair.Notes ||
                        "-"}
                    </p>
                  </div>

                </div>

              </div>

              <div className="repair-modal-footer">

                <button
                  type="button"
                  className="repair-cancel"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="repairs-primary"
                  onClick={() =>
                    openEditModal(
                      selectedRepair
                    )
                  }
                >
                  <Pencil size={15} />
                  Edit Repair
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Repairs;