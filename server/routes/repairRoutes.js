import express from "express";

import {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
} from "../controllers/repairController.js";

const router = express.Router();

router.get(
  "/",
  getRepairs
);

router.get(
  "/:id",
  getRepairById
);

router.post(
  "/",
  createRepair
);

router.put(
  "/:id",
  updateRepair
);

router.delete(
  "/:id",
  deleteRepair
);

export default router;