import pool from "../config/db.js";

// =====================================================
// GET SUPPLIERS
// GET /api/suppliers
// =====================================================

export const getSuppliers =
  async (req, res) => {
    try {
      const search =
        String(
          req.query.search || ""
        ).trim();

      let query = `
        SELECT
          SupplierID,
          SupplierCode,
          SupplierName,
          ContactPerson,
          Phone,
          Email,
          Address,
          City,
          State,
          Pincode,
          GSTNumber,
          PaymentTerms,
          Notes,
          IsActive,
          CreatedAt,
          UpdatedAt
        FROM suppliers
      `;

      const params = [];

      if (search) {
        query += `
          WHERE
            SupplierCode LIKE ?
            OR SupplierName LIKE ?
            OR ContactPerson LIKE ?
            OR Phone LIKE ?
            OR Email LIKE ?
            OR City LIKE ?
            OR GSTNumber LIKE ?
        `;

        const value =
          `%${search}%`;

        params.push(
          value,
          value,
          value,
          value,
          value,
          value,
          value
        );
      }

      query += `
        ORDER BY
          SupplierID DESC
      `;

      const [suppliers] =
        await pool.query(
          query,
          params
        );

      res.json({
        success: true,
        suppliers,
      });
    } catch (error) {
      console.error(
        "Get Suppliers Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load suppliers.",
        error: error.message,
      });
    }
  };

// =====================================================
// GET SINGLE SUPPLIER
// GET /api/suppliers/:id
// =====================================================

export const getSupplierById =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const [rows] =
        await pool.query(
          `
          SELECT *
          FROM suppliers
          WHERE SupplierID = ?
          LIMIT 1
          `,
          [id]
        );

      if (
        rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Supplier not found.",
        });
      }

      res.json({
        success: true,
        supplier: rows[0],
      });
    } catch (error) {
      console.error(
        "Get Supplier Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load supplier.",
        error: error.message,
      });
    }
  };

// =====================================================
// CREATE SUPPLIER
// POST /api/suppliers
// =====================================================

export const createSupplier =
  async (req, res) => {
    try {
      const {
        SupplierCode,
        SupplierName,
        ContactPerson,
        Phone,
        Email,
        Address,
        City,
        State,
        Pincode,
        GSTNumber,
        PaymentTerms,
        Notes,
        IsActive,
      } = req.body;

      if (
        !SupplierName ||
        !String(
          SupplierName
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Supplier name is required.",
        });
      }

      if (
        !Phone ||
        !String(
          Phone
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number is required.",
        });
      }

      const [
        result,
      ] = await pool.query(
        `
        INSERT INTO suppliers
        (
          SupplierCode,
          SupplierName,
          ContactPerson,
          Phone,
          Email,
          Address,
          City,
          State,
          Pincode,
          GSTNumber,
          PaymentTerms,
          Notes,
          IsActive
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          SupplierCode ||
            null,

          String(
            SupplierName
          ).trim(),

          ContactPerson ||
            null,

          String(
            Phone
          ).trim(),

          Email ||
            null,

          Address ||
            null,

          City ||
            null,

          State ||
            null,

          Pincode ||
            null,

          GSTNumber ||
            null,

          PaymentTerms ||
            null,

          Notes ||
            null,

          Number(
            IsActive ??
              1
          ),
        ]
      );

      res.status(201).json({
        success: true,
        message:
          "Supplier created successfully.",
        supplierId:
          result.insertId,
      });
    } catch (error) {
      console.error(
        "Create Supplier Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to create supplier.",
        error: error.message,
      });
    }
  };

// =====================================================
// UPDATE SUPPLIER
// PUT /api/suppliers/:id
// =====================================================

export const updateSupplier =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const {
        SupplierCode,
        SupplierName,
        ContactPerson,
        Phone,
        Email,
        Address,
        City,
        State,
        Pincode,
        GSTNumber,
        PaymentTerms,
        Notes,
        IsActive,
      } = req.body;

      if (
        !SupplierName ||
        !String(
          SupplierName
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Supplier name is required.",
        });
      }

      const [
        result,
      ] = await pool.query(
        `
        UPDATE suppliers
        SET
          SupplierCode = ?,
          SupplierName = ?,
          ContactPerson = ?,
          Phone = ?,
          Email = ?,
          Address = ?,
          City = ?,
          State = ?,
          Pincode = ?,
          GSTNumber = ?,
          PaymentTerms = ?,
          Notes = ?,
          IsActive = ?
        WHERE SupplierID = ?
        `,
        [
          SupplierCode ||
            null,

          String(
            SupplierName
          ).trim(),

          ContactPerson ||
            null,

          Phone ||
            null,

          Email ||
            null,

          Address ||
            null,

          City ||
            null,

          State ||
            null,

          Pincode ||
            null,

          GSTNumber ||
            null,

          PaymentTerms ||
            null,

          Notes ||
            null,

          Number(
            IsActive ??
              1
          ),

          id,
        ]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Supplier not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Supplier updated successfully.",
      });
    } catch (error) {
      console.error(
        "Update Supplier Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update supplier.",
        error: error.message,
      });
    }
  };

// =====================================================
// DELETE SUPPLIER
// DELETE /api/suppliers/:id
// =====================================================

export const deleteSupplier =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const [
        result,
      ] = await pool.query(
        `
        DELETE FROM suppliers
        WHERE SupplierID = ?
        `,
        [id]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Supplier not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Supplier deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Supplier Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete supplier.",
        error: error.message,
      });
    }
  };