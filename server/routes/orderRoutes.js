import express from "express";

import {
  getOrders,
  getOrderFormData,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.get(
  "/form-data",
  getOrderFormData
);

router.get(
  "/",
  getOrders
);

router.get(
  "/:id",
  getOrderById
);

router.post(
  "/",
  createOrder
);

router.put(
  "/:id",
  updateOrder
);

router.delete(
  "/:id",
  deleteOrder
);

export default router;