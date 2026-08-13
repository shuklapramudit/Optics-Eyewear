import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  IndianRupee,
  Plus,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Clock3,
  CreditCard,
  Wallet,
  Building2,
  UserRound,
  FileText,
  Loader2,
} from "lucide-react";

import "./Payments.css";

const API =
  "https://inventry-management-system-k9a5.onrender.com/api/payments";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Payments() {
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    paymentType: "sale",
    customerId: "",
    supplierId: "",
    paymentMethod: "cash",
    amount: "",
    transactionReference: "",
    paymentDate: new Date()
      .toISOString()
      .split("T")[0],
    notes: "",
  });

  /* =========================================================
     LOAD PAYMENTS
  ========================================================= */

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load payments."
        );
      }

      setPayments(
        Array.isArray(data.payments)
          ? data.payments
          : Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.error("Payments load error:", err);

      setError(
        err.message || "Unable to load payments."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setForm({
      paymentType: "sale",
      customerId: "",
      supplierId: "",
      paymentMethod: "cash",
      amount: "",
      transactionReference: "",
      paymentDate: new Date()
        .toISOString()
        .split("T")[0],
      notes: "",
    });
  };

  /* =========================================================
     OPEN MODAL
  ========================================================= */

  const openModal = () => {
    setError("");
    setMessage("");
    resetForm();
    setShowModal(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
  };

  /* =========================================================
     CREATE PAYMENT
  ========================================================= */

  const createPayment = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError(
        "Payment amount must be greater than zero."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        paymentType: form.paymentType,

        customerId:
          form.paymentType === "sale" &&
          form.customerId
            ? Number(form.customerId)
            : null,

        supplierId:
          form.paymentType === "purchase" &&
          form.supplierId
            ? Number(form.supplierId)
            : null,

        paymentMethod:
          form.paymentMethod,

        amount:
          Number(form.amount),

        transactionReference:
          form.transactionReference.trim() ||
          null,

        paymentDate:
          form.paymentDate,

        notes:
          form.notes.trim() || null,
      };

      const response = await fetch(
        `${API}/create`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
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
            "Unable to create payment."
        );
      }

      setMessage(
        "Payment recorded successfully."
      );

      setShowModal(false);

      resetForm();

      await loadPayments();
    } catch (err) {
      console.error(
        "Create payment error:",
        err
      );

      setError(
        err.message ||
          "Unable to create payment."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredPayments = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return payments;
    }

    return payments.filter((payment) => {
      const text = [
        payment.PaymentID,
        payment.paymentId,
        payment.PaymentType,
        payment.paymentType,
        payment.PaymentMethod,
        payment.paymentMethod,
        payment.CustomerName,
        payment.customerName,
        payment.SupplierName,
        payment.supplierName,
        payment.TransactionReference,
        payment.transactionReference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(value);
    });
  }, [payments, search]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const total = payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.Amount ??
            payment.amount ??
            0
        ),
      0
    );

    const cash = payments
      .filter(
        (payment) =>
          String(
            payment.PaymentMethod ??
              payment.paymentMethod ??
              ""
          ).toLowerCase() ===
          "cash"
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.Amount ??
              payment.amount ??
              0
          ),
        0
      );

    const online = payments
      .filter((payment) => {
        const method = String(
          payment.PaymentMethod ??
            payment.paymentMethod ??
            ""
        ).toLowerCase();

        return [
          "upi",
          "card",
          "bank_transfer",
        ].includes(method);
      })
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.Amount ??
              payment.amount ??
              0
          ),
        0
      );

    return {
      total,
      cash,
      online,
      count: payments.length,
    };
  }, [payments]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getValue = (
    payment,
    upper,
    lower
  ) =>
    payment[upper] ??
    payment[lower] ??
    "-";

  const formatDate = (value) => {
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

  const getMethodIcon = (
    method
  ) => {
    const value =
      String(method || "")
        .toLowerCase();

    if (value === "cash") {
      return <Wallet size={15} />;
    }

    if (value === "card") {
      return (
        <CreditCard size={15} />
      );
    }

    if (
      value === "upi" ||
      value ===
        "bank_transfer"
    ) {
      return (
        <IndianRupee size={15} />
      );
    }

    return (
      <IndianRupee size={15} />
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="payments-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="payments-page-top">

        <div>
          <h1>Payments</h1>

          <p>
            Manage customer and supplier
            payment transactions.
          </p>
        </div>

        <div className="payments-actions">

          <button
            type="button"
            className="secondary-btn"
            onClick={loadPayments}
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
            type="button"
            className="primary-btn"
            onClick={openModal}
          >
            <Plus size={17} />

            Add Payment
          </button>

        </div>

      </div>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {error && !showModal && (
        <div className="payment-alert error">

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
        <div className="payment-alert success">

          <CheckCircle2 size={17} />

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

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="payment-summary-grid">

        <div className="payment-summary-card">

          <div className="summary-icon blue">
            <IndianRupee size={21} />
          </div>

          <div>
            <span>
              Total Payments
            </span>

            <strong>
              ₹{money(summary.total)}
            </strong>
          </div>

        </div>

        <div className="payment-summary-card">

          <div className="summary-icon green">
            <Wallet size={21} />
          </div>

          <div>
            <span>
              Cash Payments
            </span>

            <strong>
              ₹{money(summary.cash)}
            </strong>
          </div>

        </div>

        <div className="payment-summary-card">

          <div className="summary-icon purple">
            <CreditCard size={21} />
          </div>

          <div>
            <span>
              Digital Payments
            </span>

            <strong>
              ₹{money(summary.online)}
            </strong>
          </div>

        </div>

        <div className="payment-summary-card">

          <div className="summary-icon orange">
            <FileText size={21} />
          </div>

          <div>
            <span>
              Transactions
            </span>

            <strong>
              {summary.count}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          PAYMENT HISTORY
      ===================================================== */}

      <div className="payments-card">

        <div className="payments-card-header">

          <div>
            <h2>
              Payment History
            </h2>

            <span>
              Latest payment transactions
            </span>
          </div>

          <div className="payment-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search payments..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {loading ? (
          <div className="payment-loading">

            <Loader2
              size={28}
              className="spin"
            />

            <span>
              Loading payments...
            </span>

          </div>
        ) : filteredPayments.length ===
          0 ? (
          <div className="payment-empty">

            <Wallet size={42} />

            <h3>
              No payments found
            </h3>

            <p>
              Payment transactions
              will appear here.
            </p>

          </div>
        ) : (
          <div className="payment-table-wrapper">

            <table className="payment-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Party</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {filteredPayments.map(
                  (payment, index) => {

                    const id =
                      getValue(
                        payment,
                        "PaymentID",
                        "paymentId"
                      );

                    const type =
                      getValue(
                        payment,
                        "PaymentType",
                        "paymentType"
                      );

                    const customer =
                      getValue(
                        payment,
                        "CustomerName",
                        "customerName"
                      );

                    const supplier =
                      getValue(
                        payment,
                        "SupplierName",
                        "supplierName"
                      );

                    const party =
                      customer !== "-"
                        ? customer
                        : supplier;

                    const method =
                      getValue(
                        payment,
                        "PaymentMethod",
                        "paymentMethod"
                      );

                    const amount =
                      getValue(
                        payment,
                        "Amount",
                        "amount"
                      );

                    const reference =
                      getValue(
                        payment,
                        "TransactionReference",
                        "transactionReference"
                      );

                    const date =
                      getValue(
                        payment,
                        "PaymentDate",
                        "paymentDate"
                      );

                    return (
                      <tr
                        key={
                          id ||
                          index
                        }
                      >

                        <td>
                          <strong>
                            #{id}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`type-badge ${
                              String(
                                type
                              ).toLowerCase() ===
                              "purchase"
                                ? "purchase"
                                : "sale"
                            }`}
                          >
                            {String(
                              type ||
                                "-"
                            ).toUpperCase()}
                          </span>
                        </td>

                        <td>
                          <div className="party-cell">

                            <div className="party-icon">
                              {String(
                                type
                              ).toLowerCase() ===
                              "purchase" ? (
                                <Building2
                                  size={14}
                                />
                              ) : (
                                <UserRound
                                  size={14}
                                />
                              )}
                            </div>

                            <span>
                              {party}
                            </span>

                          </div>
                        </td>

                        <td>

                          <span className="method-badge">

                            {getMethodIcon(
                              method
                            )}

                            {String(
                              method ||
                                "-"
                            ).replace(
                              "_",
                              " "
                            )}

                          </span>

                        </td>

                        <td>
                          {reference}
                        </td>

                        <td className="amount-cell">
                          ₹
                          {money(
                            amount
                          )}
                        </td>

                        <td>
                          {formatDate(
                            date
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

      {/* =====================================================
          ADD PAYMENT MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="payment-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="payment-modal">

            <div className="payment-modal-header">

              <div>
                <h2>
                  Add Payment
                </h2>

                <span>
                  Record a new payment transaction
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

            {error && (
              <div className="modal-error">
                {error}
              </div>
            )}

            <form
              onSubmit={
                createPayment
              }
            >

              <div className="modal-form-grid">

                <div className="form-group">

                  <label>
                    Payment Type
                  </label>

                  <select
                    name="paymentType"
                    value={
                      form.paymentType
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="sale">
                      Sale / Customer
                    </option>

                    <option value="purchase">
                      Purchase / Supplier
                    </option>

                    <option value="refund">
                      Refund
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={
                      form.paymentMethod
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="cash">
                      Cash
                    </option>

                    <option value="upi">
                      UPI
                    </option>

                    <option value="card">
                      Card
                    </option>

                    <option value="bank_transfer">
                      Bank Transfer
                    </option>

                    <option value="credit">
                      Credit
                    </option>

                  </select>

                </div>

                {form.paymentType ===
                  "sale" && (
                  <div className="form-group">

                    <label>
                      Customer ID
                    </label>

                    <input
                      type="number"
                      name="customerId"
                      placeholder="Enter customer ID"
                      value={
                        form.customerId
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>
                )}

                {form.paymentType ===
                  "purchase" && (
                  <div className="form-group">

                    <label>
                      Supplier ID
                    </label>

                    <input
                      type="number"
                      name="supplierId"
                      placeholder="Enter supplier ID"
                      value={
                        form.supplierId
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>
                )}

                <div className="form-group">

                  <label>
                    Amount *
                  </label>

                  <div className="amount-input">

                    <IndianRupee
                      size={16}
                    />

                    <input
                      type="number"
                      name="amount"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        form.amount
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Payment Date
                  </label>

                  <input
                    type="date"
                    name="paymentDate"
                    value={
                      form.paymentDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Transaction Reference
                  </label>

                  <input
                    type="text"
                    name="transactionReference"
                    placeholder="UPI ID / transaction number / reference"
                    value={
                      form.transactionReference
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    rows="3"
                    placeholder="Optional notes..."
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

              <div className="payment-modal-footer">

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
                  className="primary-btn"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={16}
                      />

                      Save Payment
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Payments;