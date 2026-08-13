import express from "express";

import {
  getInventory,
  getInventorySummaryData,
  getInventoryProduct,
  changeStock,
} from "../controllers/inventoryController.js";

const router =
  express.Router();

// =====================================================
// GET INVENTORY SUMMARY
// IMPORTANT: KEEP BEFORE /product/:productId
// =====================================================

router.get(
  "/summary",
  getInventorySummaryData
);

// =====================================================
// GET ALL INVENTORY
// GET /api/inventory
// =====================================================

router.get(
  "/",
  getInventory
);

// =====================================================
// GET INVENTORY BY PRODUCT
// GET /api/inventory/product/:productId
// =====================================================

router.get(
  "/product/:productId",
  getInventoryProduct
);

// =====================================================
// STOCK IN / STOCK OUT
// POST /api/inventory/stock
// =====================================================

router.post(
  "/stock",
  changeStock
);

// =====================================================
// EXPORT
// =====================================================

export default router;