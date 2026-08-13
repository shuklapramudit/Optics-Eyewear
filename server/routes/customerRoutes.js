import express from "express";

import {
  getCustomers,
  getCustomerSummary,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

const router =
  express.Router();

// =====================================================
// CUSTOMER SUMMARY
// IMPORTANT:
// /summary MUST BE BEFORE /:id
// =====================================================

router.get(
  "/summary",
  getCustomerSummary
);

// =====================================================
// GET ALL CUSTOMERS
// GET /api/customers
// =====================================================

router.get(
  "/",
  getCustomers
);

// =====================================================
// GET SINGLE CUSTOMER
// GET /api/customers/:id
// =====================================================

router.get(
  "/:id",
  getCustomerById
);

// =====================================================
// CREATE CUSTOMER
// POST /api/customers
// =====================================================

router.post(
  "/",
  createCustomer
);

// =====================================================
// UPDATE CUSTOMER
// PUT /api/customers/:id
// =====================================================

router.put(
  "/:id",
  updateCustomer
);

// =====================================================
// DELETE CUSTOMER
// DELETE /api/customers/:id
// =====================================================

router.delete(
  "/:id",
  deleteCustomer
);

export default router;