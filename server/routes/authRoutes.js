import express from "express";

import {
  loginUser,
  getCurrentUser
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


/* =========================================
   LOGIN
========================================= */

router.post("/login", loginUser);


/* =========================================
   CURRENT USER
========================================= */

router.get("/me", protect, getCurrentUser);


export default router;