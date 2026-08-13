import pool from "../config/db.js";

// =====================================================
// GENERATE ORDER NUMBER
// =====================================================

export const generateOrderNumber =
  async (connection) => {
    const [rows] =
      await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM orders
        `
      );

    const nextNumber =
      Number(rows[0].total || 0) +
      1;

    return `CP-ORD-${String(
      nextNumber
    ).padStart(5, "0")}`;
  };

// =====================================================
// GENERATE INVOICE NUMBER
// =====================================================

export const generateInvoiceNumber =
  async (connection) => {
    const [rows] =
      await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM invoices
        `
      );

    const nextNumber =
      Number(rows[0].total || 0) +
      1;

    return `CP-INV-${String(
      nextNumber
    ).padStart(5, "0")}`;
  };

// =====================================================
// GET CUSTOMERS
// =====================================================

export const fetchCustomers =
  async () => {
    const [rows] =
      await pool.query(
        `
        SELECT *
        FROM customers
        ORDER BY CustomerID DESC
        `
      );

    return rows;
  };

// =====================================================
// GET PRODUCTS
// =====================================================

export const fetchProducts =
  async () => {
    const [rows] =
      await pool.query(
        `
        SELECT *
        FROM products
        ORDER BY ProductID DESC
        `
      );

    return rows;
  };

// =====================================================
// GET INVOICE HISTORY
// =====================================================

export const fetchInvoices =
  async () => {
    const [rows] =
      await pool.query(
        `
        SELECT *
        FROM invoices
        ORDER BY InvoiceID DESC
        `
      );

    return rows;
  };