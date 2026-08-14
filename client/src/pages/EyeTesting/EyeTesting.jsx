import React, { useEffect, useMemo, useState } from "react";

import {
  Eye,
  Plus,
  Search,
  UserRound,
  Save,
  X,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  Phone,
  FileText
} from "lucide-react";

import "./EyeTesting.css";

import API_BASE_URL from "../../services/api.js";

const API =
  `${API_BASE_URL}/eye-tests`;

const emptyForm = {
  CustomerID: "",

  RightSPH: "",
  RightCYL: "",
  RightAXIS: "",
  RightADD: "",

  LeftSPH: "",
  LeftCYL: "",
  LeftAXIS: "",
  LeftADD: "",

  PD: "",

  VisualAcuityRight: "",
  VisualAcuityLeft: "",

  DoctorName: "",
  TestedBy: "",
  Complaint: "",
  Notes: "",
  NextCheckupDate: ""
};

function EyeTesting() {
  const [tests, setTests] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [viewTest, setViewTest] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const loadCustomers = async () => {
    try {
      const response = await fetch(
        `${API}/form-data`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load customers."
        );
      }

      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load customers."
      );
    }
  };

  // =====================================================
  // LOAD EYE TESTS
  // =====================================================

  const loadTests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}?search=${encodeURIComponent(search)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load eye tests."
        );
      }

      setTests(data.tests || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load eye tests."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTests();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // =====================================================
  // LOAD PREVIOUS EYE TEST
  // =====================================================

  const loadPreviousEyeTest = async (
    customerId
  ) => {
    if (!customerId) {
      return;
    }

    try {
      setLoadingPrevious(true);

      const response = await fetch(
        `${API}/customer/${customerId}/latest`
      );

      const data = await response.json();

      /*
       * No previous test is NOT an error.
       */

      if (
        response.status === 404 ||
        !data.success
      ) {
        return;
      }

      const previousTest =
        data.test;

      if (!previousTest) {
        return;
      }

      /*
       * Only auto-fill ADD values.
       *
       * Other prescription values are intentionally
       * NOT copied automatically.
       */

      setForm((previous) => ({
        ...previous,

        RightADD:
          previous.RightADD !== ""
            ? previous.RightADD
            : previousTest.RightADD ?? "",

        LeftADD:
          previous.LeftADD !== ""
            ? previous.LeftADD
            : previousTest.LeftADD ?? ""
      }));

    } catch (err) {
      /*
       * Previous prescription is optional.
       * Don't block the eye test if this request fails.
       */

      console.error(
        "Previous eye test error:",
        err
      );
    } finally {
      setLoadingPrevious(false);
    }
  };

  // =====================================================
  // CUSTOMER CHANGE
  // =====================================================

  const handleCustomerChange = async (e) => {
    const value = e.target.value;

    /*
     * Customer change par prescription values reset
     * kar dete hain so previous customer ki ADD
     * accidentally carry forward na ho.
     */

    setForm((previous) => ({
      ...previous,

      CustomerID: value,

      RightSPH: "",
      RightCYL: "",
      RightAXIS: "",
      RightADD: "",

      LeftSPH: "",
      LeftCYL: "",
      LeftAXIS: "",
      LeftADD: "",

      PD: "",

      VisualAcuityRight: "",
      VisualAcuityLeft: ""
    }));

    /*
     * New test mein hi previous ADD detect hogi.
     *
     * Existing test edit karte waqt ye function
     * call nahi hota.
     */

    if (!editingId && value) {
      await loadPreviousEyeTest(value);
    }
  };

  // =====================================================
  // OPEN NEW TEST
  // =====================================================

  const openNewTest = () => {
    setEditingId(null);

    setForm({
      ...emptyForm
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingId(null);

    setForm({
      ...emptyForm
    });

    setError("");
  };

  // =====================================================
  // EDIT TEST
  // =====================================================

  const editTest = (test) => {
    setEditingId(test.EyeTestID);

    /*
     * IMPORTANT:
     * Edit mein database ki existing values hi load hongi.
     * Previous-test auto detection nahi chalegi.
     */

    setForm({
      CustomerID:
        test.CustomerID || "",

      RightSPH:
        test.RightSPH ?? "",

      RightCYL:
        test.RightCYL ?? "",

      RightAXIS:
        test.RightAXIS ?? "",

      RightADD:
        test.RightADD ?? "",

      LeftSPH:
        test.LeftSPH ?? "",

      LeftCYL:
        test.LeftCYL ?? "",

      LeftAXIS:
        test.LeftAXIS ?? "",

      LeftADD:
        test.LeftADD ?? "",

      PD:
        test.PD ?? "",

      VisualAcuityRight:
        test.VisualAcuityRight ?? "",

      VisualAcuityLeft:
        test.VisualAcuityLeft ?? "",

      DoctorName:
        test.DoctorName ?? "",

      TestedBy:
        test.TestedBy ?? "",

      Complaint:
        test.Complaint ?? "",

      Notes:
        test.Notes ?? "",

      NextCheckupDate:
        test.NextCheckupDate
          ? String(
              test.NextCheckupDate
            ).slice(0, 10)
          : ""
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.CustomerID) {
      setError(
        "Please select a customer."
      );

      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      const method = editingId
        ? "PUT"
        : "POST";

      const url = editingId
        ? `${API}/${editingId}`
        : API;

      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(
            form
          )
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
            "Unable to save eye test."
        );
      }

      setSuccess(
        editingId
          ? "Eye test updated successfully."
          : "Eye test saved successfully."
      );

      setShowModal(false);

      setEditingId(null);

      setForm({
        ...emptyForm
      });

      await loadTests();

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save eye test."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const deleteTest = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this eye test?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API}/${id}`,
        {
          method: "DELETE"
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
            "Unable to delete eye test."
        );
      }

      setSuccess(
        "Eye test deleted successfully."
      );

      await loadTests();

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to delete eye test."
      );
    }
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const total =
      tests.length;

    const today =
      tests.filter((test) => {
        if (!test.TestDate) {
          return false;
        }

        return (
          new Date(
            test.TestDate
          ).toDateString() ===
          new Date().toDateString()
        );
      }).length;

    const customersCount =
      new Set(
        tests.map(
          (test) =>
            test.CustomerID
        )
      ).size;

    return {
      total,
      today,
      customers:
        customersCount
    };
  }, [tests]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
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
  // SELECTED CUSTOMER
  // =====================================================

  const selectedCustomer =
    customers.find(
      (customer) =>
        String(
          customer.CustomerID
        ) ===
        String(
          form.CustomerID
        )
    );

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="eye-testing-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page-top">

        <div>
          <h1>
            Eye Testing
          </h1>

          <p>
            Record customer eye tests and
            prescription details.
          </p>
        </div>

        <div className="page-actions">

          <button
            className="secondary-btn"
            onClick={loadTests}
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

          <button
            className="primary-btn"
            onClick={openNewTest}
          >
            <Plus size={17} />

            New Eye Test
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="alert error">

          <span>
            {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="alert success">

          <span>
            {success}
          </span>

          <button
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="eye-summary">

        <div className="summary-card">

          <div className="summary-icon blue">
            <Eye size={21} />
          </div>

          <div>
            <span>
              Total Eye Tests
            </span>

            <strong>
              {summary.total}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon green">
            <CalendarDays
              size={21}
            />
          </div>

          <div>
            <span>
              Today's Tests
            </span>

            <strong>
              {summary.today}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon orange">
            <UserRound
              size={21}
            />
          </div>

          <div>
            <span>
              Customers Tested
            </span>

            <strong>
              {summary.customers}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          HISTORY
      ================================================= */}

      <div className="history-card">

        <div className="history-header">

          <div>
            <h2>
              Eye Test History
            </h2>

            <p>
              Latest customer examinations
            </p>
          </div>

          <div className="search-box">

            <Search size={17} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search customer..."
            />

          </div>

        </div>

        <div className="table-wrapper">

          <table className="eye-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Date</th>
                <th>Right Eye</th>
                <th>Left Eye</th>
                <th>PD</th>
                <th>Doctor</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="9"
                    className="empty-row"
                  >
                    Loading eye tests...
                  </td>
                </tr>

              ) : tests.length === 0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="empty-row"
                  >

                    <Eye size={42} />

                    <strong>
                      No eye tests found
                    </strong>

                    <span>
                      Create a new eye test
                      to see records here.
                    </span>

                  </td>

                </tr>

              ) : (

                tests.map((test) => (

                  <tr
                    key={
                      test.EyeTestID
                    }
                  >

                    <td>
                      #{test.EyeTestID}
                    </td>

                    <td>

                      <div className="customer-cell">

                        <div className="customer-avatar">
                          <UserRound
                            size={16}
                          />
                        </div>

                        <strong>
                          {test.CustomerName ||
                            "Unknown Customer"}
                        </strong>

                      </div>

                    </td>

                    <td>
                      {test.MobileNumber ||
                        "-"}
                    </td>

                    <td>
                      {formatDate(
                        test.TestDate
                      )}
                    </td>

                    <td>

                      <span className="prescription-badge">

                        {test.RightSPH ??
                          "0.00"}

                        {" / "}

                        {test.RightCYL ??
                          "0.00"}

                        {" / "}

                        {test.RightAXIS ??
                          "0"}

                      </span>

                    </td>

                    <td>

                      <span className="prescription-badge">

                        {test.LeftSPH ??
                          "0.00"}

                        {" / "}

                        {test.LeftCYL ??
                          "0.00"}

                        {" / "}

                        {test.LeftAXIS ??
                          "0"}

                      </span>

                    </td>

                    <td>
                      {test.PD || "-"}
                    </td>

                    <td>
                      {test.DoctorName ||
                        "-"}
                    </td>

                    <td>

                      <div className="action-buttons">

                        <button
                          className="action-button"
                          title="View"
                          onClick={() =>
                            setViewTest(
                              test
                            )
                          }
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          className="action-button"
                          title="Edit"
                          onClick={() =>
                            editTest(
                              test
                            )
                          }
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          className="action-button delete"
                          title="Delete"
                          onClick={() =>
                            deleteTest(
                              test.EyeTestID
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

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (

        <div className="modal-overlay">

          <div className="eye-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingId
                    ? "Edit Eye Test"
                    : "New Eye Test"}
                </h2>

                <p>
                  Enter customer and
                  prescription details.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                <X size={21} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="eye-form"
            >

              {/* =================================================
                  CUSTOMER
              ================================================= */}

              <div className="form-section">

                <div className="section-title">

                  <UserRound size={17} />

                  <div>
                    <h3>
                      Customer Details
                    </h3>

                    <span>
                      Select customer for this test
                    </span>
                  </div>

                </div>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Customer *
                    </label>

                    <select
                      name="CustomerID"
                      value={
                        form.CustomerID
                      }
                      onChange={
                        handleCustomerChange
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
                            {customer.CustomerName}
                            {" - "}
                            {customer.MobileNumber}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div className="customer-preview">

                    {selectedCustomer ? (

                      <>
                        <span>
                          Selected Customer
                        </span>

                        <strong>
                          {
                            selectedCustomer.CustomerName
                          }
                        </strong>

                        <small>

                          <Phone
                            size={13}
                          />

                          {
                            selectedCustomer.MobileNumber ||
                            "-"
                          }

                        </small>
                      </>

                    ) : (

                      <>
                        <span>
                          Customer
                        </span>

                        <strong>
                          No customer selected
                        </strong>
                      </>

                    )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  PRESCRIPTION
              ================================================= */}

              <div className="form-section">

                <div className="section-title">

                  <Eye size={17} />

                  <div>
                    <h3>
                      Prescription
                    </h3>

                    <span>
                      Enter right and left eye values
                    </span>
                  </div>

                </div>

                {/* AUTO ADD MESSAGE */}

                {loadingPrevious && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "#edf4ff",
                      color: "#3975ed",
                      fontSize: "11px"
                    }}
                  >
                    Checking previous eye test...
                  </div>
                )}

                {!editingId &&
                  form.CustomerID &&
                  !loadingPrevious &&
                  (form.RightADD ||
                    form.LeftADD) && (

                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#eafaf2",
                        border: "1px solid #c8efdc",
                        color: "#138a5a",
                        fontSize: "11px"
                      }}
                    >
                      Previous ADD values detected and
                      filled automatically. You can change
                      them if required.
                    </div>

                  )}

                <div className="prescription-table">

                  <div className="prescription-head">

                    <span></span>

                    <span>
                      SPH
                    </span>

                    <span>
                      CYL
                    </span>

                    <span>
                      AXIS
                    </span>

                    <span>
                      ADD
                    </span>

                  </div>

                  {/* RIGHT */}

                  <div className="prescription-row">

                    <strong>
                      Right Eye (OD)
                    </strong>

                    <input
                      type="number"
                      step="0.25"
                      name="RightSPH"
                      value={
                        form.RightSPH
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="RightCYL"
                      value={
                        form.RightCYL
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="180"
                      name="RightAXIS"
                      value={
                        form.RightAXIS
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="RightADD"
                      value={
                        form.RightADD
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                  </div>

                  {/* LEFT */}

                  <div className="prescription-row">

                    <strong>
                      Left Eye (OS)
                    </strong>

                    <input
                      type="number"
                      step="0.25"
                      name="LeftSPH"
                      value={
                        form.LeftSPH
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="LeftCYL"
                      value={
                        form.LeftCYL
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="180"
                      name="LeftAXIS"
                      value={
                        form.LeftAXIS
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="LeftADD"
                      value={
                        form.LeftADD
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                  </div>

                </div>

                <div className="form-grid three">

                  <div className="form-group">

                    <label>
                      PD
                    </label>

                    <input
                      type="number"
                      step="0.5"
                      name="PD"
                      value={form.PD}
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 62"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Right Visual Acuity
                    </label>

                    <input
                      name="VisualAcuityRight"
                      value={
                        form.VisualAcuityRight
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 6/6"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Left Visual Acuity
                    </label>

                    <input
                      name="VisualAcuityLeft"
                      value={
                        form.VisualAcuityLeft
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 6/6"
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  TEST DETAILS
              ================================================= */}

              <div className="form-section">

                <div className="section-title">

                  <FileText size={17} />

                  <div>

                    <h3>
                      Test Details
                    </h3>

                    <span>
                      Examination and follow-up information
                    </span>

                  </div>

                </div>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Doctor / Optometrist
                    </label>

                    <input
                      name="DoctorName"
                      value={
                        form.DoctorName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter name"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Tested By
                    </label>

                    <input
                      name="TestedBy"
                      value={
                        form.TestedBy
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Staff / optometrist"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Next Checkup Date
                    </label>

                    <input
                      type="date"
                      name="NextCheckupDate"
                      value={
                        form.NextCheckupDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Complaint
                    </label>

                    <input
                      name="Complaint"
                      value={
                        form.Complaint
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Customer complaint"
                    />

                  </div>

                </div>

                <div className="form-group full">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="Notes"
                    rows="4"
                    value={
                      form.Notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Additional observations..."
                  />

                </div>

              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-test-btn"
                  disabled={saving}
                >

                  {saving ? (

                    <>
                      <RefreshCw
                        size={16}
                        className="spin"
                      />

                      Saving...
                    </>

                  ) : (

                    <>
                      <Save size={16} />

                      {editingId
                        ? "Update Eye Test"
                        : "Save Eye Test"}
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

      {viewTest && (

        <div className="modal-overlay">

          <div className="view-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Eye Test Details
                </h2>

                <p>
                  Complete prescription record
                </p>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setViewTest(null)
                }
              >
                <X size={21} />
              </button>

            </div>

            <div className="view-content">

              <div className="view-customer">

                <div className="customer-avatar large">
                  <UserRound
                    size={22}
                  />
                </div>

                <div>

                  <strong>
                    {viewTest.CustomerName ||
                      "-"}
                  </strong>

                  <span>
                    {viewTest.MobileNumber ||
                      "-"}
                  </span>

                </div>

              </div>

              <div className="view-section">

                <h3>
                  Right Eye (OD)
                </h3>

                <div className="view-grid">

                  <div>
                    <span>SPH</span>
                    <strong>
                      {viewTest.RightSPH ??
                        "0.00"}
                    </strong>
                  </div>

                  <div>
                    <span>CYL</span>
                    <strong>
                      {viewTest.RightCYL ??
                        "0.00"}
                    </strong>
                  </div>

                  <div>
                    <span>AXIS</span>
                    <strong>
                      {viewTest.RightAXIS ??
                        "0"}
                    </strong>
                  </div>

                  <div>
                    <span>ADD</span>
                    <strong>
                      {viewTest.RightADD ??
                        "0.00"}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="view-section">

                <h3>
                  Left Eye (OS)
                </h3>

                <div className="view-grid">

                  <div>
                    <span>SPH</span>
                    <strong>
                      {viewTest.LeftSPH ??
                        "0.00"}
                    </strong>
                  </div>

                  <div>
                    <span>CYL</span>
                    <strong>
                      {viewTest.LeftCYL ??
                        "0.00"}
                    </strong>
                  </div>

                  <div>
                    <span>AXIS</span>
                    <strong>
                      {viewTest.LeftAXIS ??
                        "0"}
                    </strong>
                  </div>

                  <div>
                    <span>ADD</span>
                    <strong>
                      {viewTest.LeftADD ??
                        "0.00"}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="view-grid">

                <div>
                  <span>PD</span>
                  <strong>
                    {viewTest.PD || "-"}
                  </strong>
                </div>

                <div>
                  <span>Right VA</span>
                  <strong>
                    {viewTest.VisualAcuityRight ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>Left VA</span>
                  <strong>
                    {viewTest.VisualAcuityLeft ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>Doctor</span>
                  <strong>
                    {viewTest.DoctorName ||
                      "-"}
                  </strong>
                </div>

              </div>

              <div className="notes-box">

                <span>
                  Notes
                </span>

                <p>
                  {viewTest.Notes ||
                    "No notes available."}
                </p>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default EyeTesting;
