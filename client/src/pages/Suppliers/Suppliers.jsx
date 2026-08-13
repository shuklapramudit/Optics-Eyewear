import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
} from "lucide-react";

import "./Suppliers.css";

const API =
  "https://inventry-management-system-k9a5.onrender.com/api/suppliers";

const emptyForm = {
  SupplierCode: "",
  SupplierName: "",
  ContactPerson: "",
  Phone: "",
  Email: "",
  Address: "",
  City: "",
  State: "",
  Pincode: "",
  GSTNumber: "",
  PaymentTerms: "",
  Notes: "",
  IsActive: 1,
};

function Suppliers() {
  const [suppliers, setSuppliers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [modal, setModal] =
    useState(null);

  const [selectedSupplier, setSelectedSupplier] =
    useState(null);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // =====================================================
  // LOAD SUPPLIERS
  // =====================================================

  const loadSuppliers =
    async () => {
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
              "Unable to load suppliers."
          );
        }

        setSuppliers(
          Array.isArray(
            data.suppliers
          )
            ? data.suppliers
            : []
        );
      } catch (err) {
        console.error(
          "Load Suppliers Error:",
          err
        );

        setError(
          err.message ||
            "Unable to load suppliers."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadSuppliers();
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [search]);

  // =====================================================
  // CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {
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
  // ADD
  // =====================================================

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setModal("form");

    setError("");
    setMessage("");
  };

  // =====================================================
  // EDIT
  // =====================================================

  const openEditModal = (
    supplier
  ) => {
    setEditingId(
      supplier.SupplierID
    );

    setForm({
      SupplierCode:
        supplier.SupplierCode ||
        "",

      SupplierName:
        supplier.SupplierName ||
        "",

      ContactPerson:
        supplier.ContactPerson ||
        "",

      Phone:
        supplier.Phone || "",

      Email:
        supplier.Email || "",

      Address:
        supplier.Address || "",

      City:
        supplier.City || "",

      State:
        supplier.State || "",

      Pincode:
        supplier.Pincode || "",

      GSTNumber:
        supplier.GSTNumber ||
        "",

      PaymentTerms:
        supplier.PaymentTerms ||
        "",

      Notes:
        supplier.Notes || "",

      IsActive:
        supplier.IsActive ??
        1,
    });

    setModal("form");

    setError("");
    setMessage("");
  };

  // =====================================================
  // CLOSE
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
  // SAVE
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.SupplierName.trim()
    ) {
      setError(
        "Supplier name is required."
      );

      return;
    }

    if (
      !form.Phone.trim()
    ) {
      setError(
        "Phone number is required."
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        SupplierCode:
          form.SupplierCode.trim(),

        SupplierName:
          form.SupplierName.trim(),

        ContactPerson:
          form.ContactPerson.trim(),

        Phone:
          form.Phone.trim(),

        Email:
          form.Email.trim(),

        Address:
          form.Address.trim(),

        City:
          form.City.trim(),

        State:
          form.State.trim(),

        Pincode:
          form.Pincode.trim(),

        GSTNumber:
          form.GSTNumber.trim(),

        PaymentTerms:
          form.PaymentTerms.trim(),

        Notes:
          form.Notes.trim(),

        IsActive:
          Number(
            form.IsActive
          ),
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
            "Unable to save supplier."
        );
      }

      setMessage(
        data.message ||
          "Supplier saved successfully."
      );

      closeModal();

      await loadSuppliers();
    } catch (err) {
      console.error(
        "Save Supplier Error:",
        err
      );

      setError(
        err.message ||
          "Unable to save supplier."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // VIEW
  // =====================================================

  const handleView = (
    supplier
  ) => {
    setSelectedSupplier(
      supplier
    );

    setModal("view");
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    supplier
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${supplier.SupplierName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/${supplier.SupplierID}`,
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
            "Unable to delete supplier."
        );
      }

      setMessage(
        data.message ||
          "Supplier deleted successfully."
      );

      await loadSuppliers();
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete supplier."
      );
    }
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary =
    useMemo(() => {
      const active =
        suppliers.filter(
          (item) =>
            Number(
              item.IsActive
            ) === 1
        ).length;

      const inactive =
        suppliers.length -
        active;

      return {
        total:
          suppliers.length,
        active,
        inactive,
      };
    }, [suppliers]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="suppliers-page">

      <div className="suppliers-header">

        <div className="suppliers-title">

          <div className="supplier-title-icon">
            <Truck size={22} />
          </div>

          <div>
            <h1>
              Suppliers
            </h1>

            <p>
              Manage supplier records and
              vendor information.
            </p>
          </div>

        </div>

        <div className="supplier-header-actions">

          <button
            type="button"
            className="supplier-refresh"
            onClick={
              loadSuppliers
            }
          >
            <RefreshCw
              size={16}
            />
            Refresh
          </button>

          <button
            type="button"
            className="supplier-primary"
            onClick={
              openAddModal
            }
          >
            <Plus size={17} />
            Add Supplier
          </button>

        </div>

      </div>

      {error && (
        <div className="supplier-alert error">
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
        <div className="supplier-alert success">
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

      <div className="supplier-summary">

        <div className="supplier-summary-card">
          <div className="supplier-summary-icon blue">
            <Truck size={20} />
          </div>

          <div>
            <span>
              Total Suppliers
            </span>

            <strong>
              {summary.total}
            </strong>
          </div>
        </div>

        <div className="supplier-summary-card">
          <div className="supplier-summary-icon green">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Active
            </span>

            <strong>
              {summary.active}
            </strong>
          </div>
        </div>

        <div className="supplier-summary-card">
          <div className="supplier-summary-icon orange">
            <Building2 size={20} />
          </div>

          <div>
            <span>
              Inactive
            </span>

            <strong>
              {summary.inactive}
            </strong>
          </div>
        </div>

      </div>

      <div className="suppliers-card">

        <div className="suppliers-toolbar">

          <div>
            <h2>
              Supplier List
            </h2>

            <span>
              {suppliers.length}
              {" "}
              suppliers
            </span>
          </div>

          <div className="supplier-search">

            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search supplier..."
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

        </div>

        <div className="suppliers-table-wrapper">

          <table className="suppliers-table">

            <thead>
              <tr>
                <th>
                  SUPPLIER
                </th>

                <th>
                  CONTACT PERSON
                </th>

                <th>
                  PHONE
                </th>

                <th>
                  EMAIL
                </th>

                <th>
                  CITY
                </th>

                <th>
                  GST NUMBER
                </th>

                <th>
                  PAYMENT TERMS
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
                    className="supplier-empty"
                  >
                    <Loader2
                      size={28}
                      className="supplier-spin"
                    />

                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="supplier-empty"
                  >
                    <Truck
                      size={40}
                    />

                    <strong>
                      No suppliers found
                    </strong>

                    <span>
                      Add your first supplier.
                    </span>
                  </td>
                </tr>
              ) : (
                suppliers.map(
                  (supplier) => (
                    <tr
                      key={
                        supplier.SupplierID
                      }
                    >

                      <td>

                        <div className="supplier-name">

                          <div className="supplier-avatar">
                            <Truck
                              size={15}
                            />
                          </div>

                          <div>
                            <strong>
                              {
                                supplier.SupplierName
                              }
                            </strong>

                            <small>
                              {supplier.SupplierCode ||
                                `SUP-${supplier.SupplierID}`}
                            </small>
                          </div>

                        </div>

                      </td>

                      <td>
                        {supplier.ContactPerson ||
                          "-"}
                      </td>

                      <td>
                        <div className="supplier-contact">
                          <Phone
                            size={13}
                          />

                          {supplier.Phone ||
                            "-"}
                        </div>
                      </td>

                      <td>
                        <div className="supplier-contact">
                          <Mail
                            size={13}
                          />

                          {supplier.Email ||
                            "-"}
                        </div>
                      </td>

                      <td>
                        {supplier.City ||
                          "-"}
                      </td>

                      <td>
                        {supplier.GSTNumber ||
                          "-"}
                      </td>

                      <td>
                        {supplier.PaymentTerms ||
                          "-"}
                      </td>

                      <td>

                        <span
                          className={
                            Number(
                              supplier.IsActive
                            ) === 1
                              ? "supplier-status active"
                              : "supplier-status inactive"
                          }
                        >
                          {Number(
                            supplier.IsActive
                          ) === 1
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td>

                        <div className="supplier-actions">

                          <button
                            type="button"
                            title="View"
                            onClick={() =>
                              handleView(
                                supplier
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
                                supplier
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
                                supplier
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
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          FORM MODAL
      ================================================= */}

      {modal === "form" && (
        <div
          className="supplier-modal-overlay"
          onClick={
            closeModal
          }
        >

          <div
            className="supplier-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="supplier-modal-header">

              <div>
                <h2>
                  {editingId
                    ? "Edit Supplier"
                    : "Add Supplier"}
                </h2>

                <span>
                  Enter supplier information.
                </span>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="supplier-form">

                <div className="supplier-form-grid">

                  <div className="supplier-field">

                    <label>
                      Supplier Code
                    </label>

                    <input
                      name="SupplierCode"
                      value={
                        form.SupplierCode
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="SUP-001"
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      Supplier Name *
                    </label>

                    <input
                      name="SupplierName"
                      value={
                        form.SupplierName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Supplier name"
                      required
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      Contact Person
                    </label>

                    <input
                      name="ContactPerson"
                      value={
                        form.ContactPerson
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Contact person"
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      Phone *
                    </label>

                    <input
                      name="Phone"
                      value={
                        form.Phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Phone number"
                      required
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="Email"
                      value={
                        form.Email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Email address"
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      GST Number
                    </label>

                    <input
                      name="GSTNumber"
                      value={
                        form.GSTNumber
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="GSTIN"
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      City
                    </label>

                    <input
                      name="City"
                      value={
                        form.City
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="City"
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      State
                    </label>

                    <input
                      name="State"
                      value={
                        form.State
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="State"
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      Pincode
                    </label>

                    <input
                      name="Pincode"
                      value={
                        form.Pincode
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Pincode"
                    />

                  </div>

                  <div className="supplier-field">

                    <label>
                      Payment Terms
                    </label>

                    <input
                      name="PaymentTerms"
                      value={
                        form.PaymentTerms
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 30 Days"
                    />

                  </div>

                  <div className="supplier-field full">

                    <label>
                      Address
                    </label>

                    <input
                      name="Address"
                      value={
                        form.Address
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Complete address"
                    />

                  </div>

                  <div className="supplier-field full">

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

                  <div className="supplier-field">

                    <label>
                      Status
                    </label>

                    <select
                      name="IsActive"
                      value={
                        form.IsActive
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="1">
                        Active
                      </option>

                      <option value="0">
                        Inactive
                      </option>
                    </select>

                  </div>

                </div>

              </div>

              <div className="supplier-modal-footer">

                <button
                  type="button"
                  className="supplier-cancel"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="supplier-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="supplier-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={16}
                      />
                      {editingId
                        ? "Update Supplier"
                        : "Add Supplier"}
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
        selectedSupplier && (
          <div
            className="supplier-modal-overlay"
            onClick={() =>
              setModal(null)
            }
          >

            <div
              className="supplier-view-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="supplier-modal-header">

                <div>
                  <h2>
                    Supplier Details
                  </h2>

                  <span>
                    {
                      selectedSupplier.SupplierName
                    }
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

              <div className="supplier-view">

                <div className="supplier-view-grid">

                  <div>
                    <span>
                      Supplier Code
                    </span>

                    <strong>
                      {selectedSupplier.SupplierCode ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Supplier Name
                    </span>

                    <strong>
                      {
                        selectedSupplier.SupplierName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Contact Person
                    </span>

                    <strong>
                      {selectedSupplier.ContactPerson ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {selectedSupplier.Phone ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {selectedSupplier.Email ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      GST Number
                    </span>

                    <strong>
                      {selectedSupplier.GSTNumber ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      City
                    </span>

                    <strong>
                      {selectedSupplier.City ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      State
                    </span>

                    <strong>
                      {selectedSupplier.State ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pincode
                    </span>

                    <strong>
                      {selectedSupplier.Pincode ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Payment Terms
                    </span>

                    <strong>
                      {selectedSupplier.PaymentTerms ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {Number(
                        selectedSupplier.IsActive
                      ) === 1
                        ? "Active"
                        : "Inactive"}
                    </strong>
                  </div>

                </div>

                <div className="supplier-address">

                  <MapPin
                    size={15}
                  />

                  <span>
                    {
                      selectedSupplier.Address ||
                      "No address available"
                    }
                  </span>

                </div>

                <div className="supplier-notes">

                  <span>
                    Notes
                  </span>

                  <p>
                    {selectedSupplier.Notes ||
                      "-"}
                  </p>

                </div>

              </div>

              <div className="supplier-modal-footer">

                <button
                  type="button"
                  className="supplier-cancel"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="supplier-primary"
                  onClick={() =>
                    openEditModal(
                      selectedSupplier
                    )
                  }
                >
                  <Pencil
                    size={15}
                  />
                  Edit Supplier
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Suppliers;