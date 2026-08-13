import express from "express";

import {
  getPurchaseFormData,
  createPurchase,
  getPurchases,
  getPurchaseById,
  getPurchaseItems,
  deletePurchase,
  getPurchaseSummary
} from "../controllers/purchaseController.js";

const router = express.Router();


// =====================================================
// PURCHASE FORM DATA
// GET /api/purchases/form-data
// =====================================================

router.get(
  "/form-data",
  getPurchaseFormData
);


// =====================================================
// PURCHASE SUMMARY
// IMPORTANT: BEFORE /:id
// =====================================================

router.get(
  "/summary",
  getPurchaseSummary
);


// =====================================================
// CREATE PURCHASE
// POST /api/purchases/create
// =====================================================

router.post(
  "/create",
  createPurchase
);


// =====================================================
// GET ALL PURCHASES
// GET /api/purchases
// =====================================================

router.get(
  "/",
  getPurchases
);


// =====================================================
// GET PURCHASE ITEMS
// GET /api/purchases/:id/items
// =====================================================

router.get(
  "/:id/items",
  getPurchaseItems
);


// =====================================================
// GET SINGLE PURCHASE
// GET /api/purchases/:id
// =====================================================

router.get(
  "/:id",
  getPurchaseById
);


// =====================================================
// DELETE PURCHASE
// DELETE /api/purchases/:id
// =====================================================

router.delete(
  "/:id",
  deletePurchase
);


// =====================================================
// EXPORT
// =====================================================

export default router;