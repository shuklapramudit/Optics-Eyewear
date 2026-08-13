import express from "express";

import {
  getEyeTestFormData,
  getEyeTests,
  getEyeTestById,
  getPreviousEyeTest,
  createEyeTest,
  updateEyeTest,
  deleteEyeTest,
  getEyeTestSummary
} from "../controllers/eyeTestController.js";

const router = express.Router();


// =====================================================
// FORM DATA
// GET /api/eye-tests/form-data
//
// IMPORTANT:
// Must come before /:id
// =====================================================

router.get(
  "/form-data",
  getEyeTestFormData
);


// =====================================================
// SUMMARY
// GET /api/eye-tests/summary
// =====================================================

router.get(
  "/summary",
  getEyeTestSummary
);


// =====================================================
// PREVIOUS EYE TEST
// GET /api/eye-tests/customer/:customerId/previous
//
// Used to get previous prescription values
// for auto-filling ADD / SPH / CYL / AXIS etc.
//
// IMPORTANT:
// Must come before /:id
// =====================================================

router.get(
  "/customer/:customerId/previous",
  getPreviousEyeTest
);


// =====================================================
// GET ALL EYE TESTS
// GET /api/eye-tests
// =====================================================

router.get(
  "/",
  getEyeTests
);


// =====================================================
// CREATE EYE TEST
// POST /api/eye-tests
// =====================================================

router.post(
  "/",
  createEyeTest
);


// =====================================================
// UPDATE EYE TEST
// PUT /api/eye-tests/:id
// =====================================================

router.put(
  "/:id",
  updateEyeTest
);


// =====================================================
// DELETE EYE TEST
// DELETE /api/eye-tests/:id
// =====================================================

router.delete(
  "/:id",
  deleteEyeTest
);


// =====================================================
// GET SINGLE EYE TEST
// GET /api/eye-tests/:id
// =====================================================

router.get(
  "/:id",
  getEyeTestById
);


// =====================================================
// EXPORT ROUTER
// =====================================================

export default router;