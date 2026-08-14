import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// =====================================================
// ALL API ROUTES IMPORTS
// =====================================================
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import eyeTestRoutes from "./routes/eyeTestRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import repairRoutes from "./routes/repairRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

// =====================================================
// DATABASE CONFIGURATION
// =====================================================
import pool, { testDatabaseConnection } from "./config/db.js";

dotenv.config();

const app = express();

// =====================================================
// BULLETPROOF CORS CONFIGURATION
// =====================================================
const explicitOrigins = [
  "https://inventry-management-system-8pp6.vercel.app",
  "https://inventry-management-system-rust.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS,
]
  .filter(Boolean)
  .flatMap((origin) => String(origin).split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      explicitOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 204,
};

// Global CORS Middleware handles standard and preflight requests
app.use(cors(corsOptions));

// =====================================================
// PATH CONFIGURATION
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 5000;

// =====================================================
// UPLOAD DIRECTORY
// =====================================================
const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// =====================================================
// BODY PARSING MIDDLEWARES
// =====================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// STATIC PRODUCT IMAGES
// =====================================================
app.use("/uploads", express.static(uploadDirectory));

// =====================================================
// ROOT & HEALTH CHECK
// =====================================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chashma Plus Inventory API is running.",
    status: "online",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    server: "Chashma Plus Inventory System",
    status: "healthy",
  });
});

// =====================================================
// DATABASE TEST
// =====================================================
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS database_connection");
    res.status(200).json({
      success: true,
      message: "MySQL database connected successfully.",
      data: rows,
    });
  } catch (error) {
    console.error("Database test error:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});

// =====================================================
// API ROUTES
// =====================================================
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/eye-tests", eyeTestRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

// =====================================================
// 404 HANDLER (Safely placed at end)
// =====================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Image size must not exceed 5 MB.",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Maximum 10 images are allowed.",
    });
  }

  if (err.message && err.message.includes("Only JPG")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// =====================================================
// START SERVER
// =====================================================
const startServer = async () => {
  try {
    const databaseConnected = await testDatabaseConnection();

    if (!databaseConnected) {
      console.error("Server startup stopped because MySQL connection failed.");
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log("----------------------------------------");
      console.log("CHASHMA PLUS INVENTORY SYSTEM");
      console.log("----------------------------------------");
      console.log(`Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
      console.log(`Uploads: http://localhost:${PORT}/uploads`);
      console.log(`Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`Dashboard API: http://localhost:${PORT}/api/dashboard`);
      console.log(`Customer API: http://localhost:${PORT}/api/customers`);
      console.log(`Product API: http://localhost:${PORT}/api/products`);
      console.log(`Inventory API: http://localhost:${PORT}/api/inventory`);
      console.log(`Sales API: http://localhost:${PORT}/api/sales`);
      console.log(`Purchase API: http://localhost:${PORT}/api/purchases`);
      console.log(`Eye Testing API: http://localhost:${PORT}/api/eye-tests`);
      console.log(`Eye Test Form Data: http://localhost:${PORT}/api/eye-tests/form-data`);
      console.log(`Eye Test Summary: http://localhost:${PORT}/api/eye-tests/summary`);
      console.log(`Order API: http://localhost:${PORT}/api/orders`);
      console.log(`Repair API: http://localhost:${PORT}/api/repairs`);
      console.log(`Supplier API: http://localhost:${PORT}/api/suppliers`);
      console.log(`Payment API: http://localhost:${PORT}/api/payments`);
      console.log(`Payment Summary: http://localhost:${PORT}/api/payments/summary`);
      console.log(`Report API: http://localhost:${PORT}/api/reports`);
      console.log(`Report Summary: http://localhost:${PORT}/api/reports/summary`);
      console.log(`Sales Report: http://localhost:${PORT}/api/reports/sales`);
      console.log(`Payment Report: http://localhost:${PORT}/api/reports/payments`);
      console.log(`Monthly Sales: http://localhost:${PORT}/api/reports/monthly-sales`);
      console.log("----------------------------------------");
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
};

startServer();