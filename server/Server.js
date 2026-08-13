import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// =====================================================
// INVENTORY ROUTES
// =====================================================

import inventoryRoutes from "./routes/inventoryRoutes.js";

// =====================================================
// SALES & BILLING ROUTES
// =====================================================

import salesRoutes from "./routes/salesRoutes.js";

// =====================================================
// PURCHASE ROUTES
// =====================================================

import purchaseRoutes from "./routes/purchaseRoutes.js";

// =====================================================
// EYE TEST ROUTES
// =====================================================

import eyeTestRoutes from "./routes/eyeTestRoutes.js";

// =====================================================
// DATABASE
// =====================================================

import pool, {
  testDatabaseConnection,
} from "./config/db.js";

// =====================================================
// AUTH / DASHBOARD / CUSTOMER ROUTES
// =====================================================

import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

// =====================================================
// PRODUCT ROUTES
// =====================================================

import productRoutes from "./routes/productRoutes.js";

// =====================================================
// ORDER / REPAIR / SUPPLIER ROUTES
// =====================================================

import orderRoutes from "./routes/orderRoutes.js";
import repairRoutes from "./routes/repairRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

// =====================================================
// PAYMENT / REPORT ROUTES
// =====================================================

import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

// =====================================================
// ENVIRONMENT CONFIGURATION
// =====================================================

dotenv.config();

const app = express();

// =====================================================
// PATH CONFIGURATION
// =====================================================

const __filename = fileURLToPath(
  import.meta.url
);

const __dirname = path.dirname(
  __filename
);

// =====================================================
// PORT
// =====================================================

const PORT =
  Number(process.env.PORT) || 5000;

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(
  __dirname,
  "uploads"
);

if (
  !fs.existsSync(
    uploadDirectory
  )
) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin:
      "https://inventry-management-system-rust.vercel.app",

    credentials:
      true,
  })
);

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// STATIC PRODUCT IMAGES
// =====================================================

app.use(
  "/uploads",
  express.static(
    uploadDirectory
  )
);

// =====================================================
// ROOT
// =====================================================

app.get(
  "/",
  (req, res) => {

    res.status(200).json({

      success: true,

      message:
        "Chashma Plus Inventory API is running.",

      status:
        "online",

    });

  }
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (req, res) => {

    res.status(200).json({

      success: true,

      server:
        "Chashma Plus Inventory System",

      status:
        "healthy",

    });

  }
);

// =====================================================
// DATABASE TEST
// =====================================================

app.get(
  "/api/db-test",
  async (
    req,
    res
  ) => {

    try {

      const [
        rows,
      ] = await pool.query(
        "SELECT 1 AS database_connection"
      );

      res.status(200).json({

        success: true,

        message:
          "MySQL database connected successfully.",

        data:
          rows,

      });

    } catch (error) {

      console.error(
        "Database test error:",
        error.message
      );

      res.status(500).json({

        success: false,

        message:
          "Database connection failed.",

        error:
          error.message,

      });

    }

  }
);

// =====================================================
// AUTH ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

// =====================================================
// DASHBOARD ROUTES
// =====================================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// =====================================================
// CUSTOMER ROUTES
// =====================================================

app.use(
  "/api/customers",
  customerRoutes
);

// =====================================================
// PRODUCT ROUTES
// =====================================================

app.use(
  "/api/products",
  productRoutes
);

// =====================================================
// INVENTORY ROUTES
// =====================================================

app.use(
  "/api/inventory",
  inventoryRoutes
);

// =====================================================
// SALES & BILLING ROUTES
// =====================================================

app.use(
  "/api/sales",
  salesRoutes
);

// =====================================================
// PURCHASE ROUTES
// =====================================================
//
// Available endpoints:
//
// GET  /api/purchases/form-data
// GET  /api/purchases/history
// GET  /api/purchases
// POST /api/purchases/create
// GET  /api/purchases/:id
//
// =====================================================

app.use(
  "/api/purchases",
  purchaseRoutes
);

// =====================================================
// EYE TEST ROUTES
// =====================================================
//
// Available endpoints:
//
// GET    /api/eye-tests/form-data
// GET    /api/eye-tests/summary
// GET    /api/eye-tests
// POST   /api/eye-tests
// GET    /api/eye-tests/:id
// PUT    /api/eye-tests/:id
// DELETE /api/eye-tests/:id
//
// =====================================================

app.use(
  "/api/eye-tests",
  eyeTestRoutes
);

// =====================================================
// ORDER ROUTES
// =====================================================
//
// Available endpoints:
//
// GET    /api/orders
// GET    /api/orders/form-data
// GET    /api/orders/:id
// POST   /api/orders
// PUT    /api/orders/:id
// DELETE /api/orders/:id
//
// =====================================================

app.use(
  "/api/orders",
  orderRoutes
);

// =====================================================
// REPAIR ROUTES
// =====================================================
//
// Available endpoints:
//
// GET    /api/repairs
// GET    /api/repairs/:id
// POST   /api/repairs
// PUT    /api/repairs/:id
// DELETE /api/repairs/:id
//
// =====================================================

app.use(
  "/api/repairs",
  repairRoutes
);

// =====================================================
// SUPPLIER ROUTES
// =====================================================
//
// Available endpoints:
//
// GET    /api/suppliers
// GET    /api/suppliers/:id
// POST   /api/suppliers
// PUT    /api/suppliers/:id
// DELETE /api/suppliers/:id
//
// =====================================================

app.use(
  "/api/suppliers",
  supplierRoutes
);

// =====================================================
// PAYMENT ROUTES
// =====================================================
//
// Available endpoints:
//
// GET    /api/payments
// GET    /api/payments/summary
// POST   /api/payments
// GET    /api/payments/:id
//
// =====================================================

app.use(
  "/api/payments",
  paymentRoutes
);

// =====================================================
// REPORT ROUTES
// =====================================================
//
// Available endpoints:
//
// GET /api/reports/summary
// GET /api/reports/sales
// GET /api/reports/payments
// GET /api/reports/monthly-sales
//
// =====================================================

app.use(
  "/api/reports",
  reportRoutes
);

// =====================================================
// 404 HANDLER
// IMPORTANT:
// MUST BE AFTER ALL API ROUTES
// =====================================================

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        "API route not found.",

    });

  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      "Server Error:",
      err
    );

    // ===============================================
    // MULTER ERROR
    // ===============================================

    if (
      err.code ===
      "LIMIT_FILE_SIZE"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Image size must not exceed 5 MB.",

      });

    }

    // ===============================================
    // FILE COUNT ERROR
    // ===============================================

    if (
      err.code ===
      "LIMIT_FILE_COUNT"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Maximum 10 images are allowed.",

      });

    }

    // ===============================================
    // IMAGE TYPE ERROR
    // ===============================================

    if (
      err.message &&
      err.message.includes(
        "Only JPG"
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          err.message,

      });

    }

    // ===============================================
    // GENERAL ERROR
    // ===============================================

    res.status(500).json({

      success: false,

      message:
        err.message ||
        "Internal server error.",

    });

  }
);

// =====================================================
// START SERVER
// =====================================================

const startServer =
  async () => {

    try {

      // =============================================
      // TEST DATABASE CONNECTION
      // =============================================

      const databaseConnected =
        await testDatabaseConnection();

      if (
        !databaseConnected
      ) {

        console.error(
          "Server startup stopped because MySQL connection failed."
        );

        process.exit(1);

      }

      // =============================================
      // START EXPRESS SERVER
      // =============================================

      app.listen(
        PORT,
        () => {

          console.log(
            "----------------------------------------"
          );

          console.log(
            "CHASHMA PLUS INVENTORY SYSTEM"
          );

          console.log(
            "----------------------------------------"
          );

          console.log(
            `Server running on port ${PORT}`
          );

          console.log(
            `http://localhost:${PORT}`
          );

          // =========================================
          // EXISTING APIs
          // =========================================

          console.log(
            `Uploads: http://localhost:${PORT}/uploads`
          );

          console.log(
            `Auth API: http://localhost:${PORT}/api/auth`
          );

          console.log(
            `Dashboard API: http://localhost:${PORT}/api/dashboard`
          );

          console.log(
            `Customer API: http://localhost:${PORT}/api/customers`
          );

          console.log(
            `Product API: http://localhost:${PORT}/api/products`
          );

          console.log(
            `Inventory API: http://localhost:${PORT}/api/inventory`
          );

          console.log(
            `Sales API: http://localhost:${PORT}/api/sales`
          );

          console.log(
            `Purchase API: http://localhost:${PORT}/api/purchases`
          );

          console.log(
            `Eye Testing API: http://localhost:${PORT}/api/eye-tests`
          );

          console.log(
            `Eye Test Form Data: http://localhost:${PORT}/api/eye-tests/form-data`
          );

          console.log(
            `Eye Test Summary: http://localhost:${PORT}/api/eye-tests/summary`
          );

          // =========================================
          // ORDER / REPAIR / SUPPLIER APIs
          // =========================================

          console.log(
            `Order API: http://localhost:${PORT}/api/orders`
          );

          console.log(
            `Repair API: http://localhost:${PORT}/api/repairs`
          );

          console.log(
            `Supplier API: http://localhost:${PORT}/api/suppliers`
          );

          // =========================================
          // PAYMENT / REPORT APIs
          // =========================================

          console.log(
            `Payment API: http://localhost:${PORT}/api/payments`
          );

          console.log(
            `Payment Summary: http://localhost:${PORT}/api/payments/summary`
          );

          console.log(
            `Report API: http://localhost:${PORT}/api/reports`
          );

          console.log(
            `Report Summary: http://localhost:${PORT}/api/reports/summary`
          );

          console.log(
            `Sales Report: http://localhost:${PORT}/api/reports/sales`
          );

          console.log(
            `Payment Report: http://localhost:${PORT}/api/reports/payments`
          );

          console.log(
            `Monthly Sales: http://localhost:${PORT}/api/reports/monthly-sales`
          );

          console.log(
            "----------------------------------------"
          );

        }
      );

    } catch (error) {

      console.error(
        "Server startup error:",
        error.message
      );

      process.exit(1);

    }

  };

startServer();