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


// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}


// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `product-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, filename);
  },
});


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG, WEBP and GIF images are allowed."
      )
    );
  }
};


// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});


// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

router.get(
  "/",
  getProducts
);


// =====================================================
// UPLOAD SINGLE IMAGE
// POST /api/products/upload-image
// =====================================================

router.post(
  "/upload-image",
  upload.single("image"),
  uploadProductImage
);


// =====================================================
// UPLOAD MULTIPLE IMAGES
// POST /api/products/upload-images
// =====================================================

router.post(
  "/upload-images",
  upload.array(
    "images",
    10
  ),
  uploadProductImages
);


// =====================================================
// DELETE PRODUCT IMAGE
// IMPORTANT: BEFORE /:id
// DELETE /api/products/images/:imageId
// =====================================================

router.delete(
  "/images/:imageId",
  deleteProductImage
);


// =====================================================
// CREATE PRODUCT
// POST /api/products
// =====================================================

router.post(
  "/",
  createProduct
);


// =====================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// =====================================================

router.get(
  "/:id",
  getProductById
);


// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================

router.put(
  "/:id",
  updateProduct
);


// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

router.delete(
  "/:id",
  deleteProduct
);


// =====================================================
// EXPORT
// =====================================================

export default router;