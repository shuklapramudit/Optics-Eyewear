import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadProductImages,
  deleteProductImage,
} from "../controllers/productController.js";

const router = express.Router();

const uploadDirectory = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

router.get("/", getProducts);

// Optional Dummy Handlers for old frontend requests to avoid crashes
router.get("/categories", (req, res) => res.status(200).json({ success: true, categories: [] }));
router.get("/brands", (req, res) => res.status(200).json({ success: true, brands: [] }));

router.post("/upload-image", upload.single("image"), uploadProductImage);
router.post("/upload-images", upload.array("images", 10), uploadProductImages);
router.delete("/images/:imageId", deleteProductImage);

router.post("/", createProduct);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;