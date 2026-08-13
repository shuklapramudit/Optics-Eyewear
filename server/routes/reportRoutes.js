import express from "express";

import {
  getReportSummary,
  getSalesReport,
  getPaymentReport,
  getMonthlySalesReport
} from "../controllers/reportController.js";

const router =
  express.Router();


// =====================================================
// SUMMARY
// IMPORTANT: BEFORE /:id IF ADDED LATER
// =====================================================

router.get(
  "/summary",
  getReportSummary
);


// =====================================================
// SALES REPORT
// =====================================================

router.get(
  "/sales",
  getSalesReport
);


// =====================================================
// PAYMENT REPORT
// =====================================================

router.get(
  "/payments",
  getPaymentReport
);


// =====================================================
// MONTHLY SALES
// =====================================================

router.get(
  "/monthly-sales",
  getMonthlySalesReport
);


export default router;