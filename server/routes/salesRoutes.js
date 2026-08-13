import express from "express";

import {
  getSalesFormData,
  createInvoice,
  getInvoiceHistory,
} from "../controllers/salesController.js";

const router =
  express.Router();

// =====================================================
// SALES FORM DATA
// =====================================================

router.get(
  "/form-data",
  getSalesFormData
);

// =====================================================
// CREATE INVOICE
// =====================================================

router.post(
  "/create-invoice",
  createInvoice
);

// =====================================================
// INVOICE HISTORY
// =====================================================

router.get(
  "/invoices",
  getInvoiceHistory
);

export default router;