import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Glasses,
  X,
  RefreshCw,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Link as LinkIcon,
  Save,
  GripVertical,
} from "lucide-react";

import "./Products.css";

import API_BASE_URL from "../../services/api.js";

const API = `${API_BASE_URL}/products`;

const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function Products() {
  // =====================================================
  // MAIN STATE
  // =====================================================

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // VIEW MODAL
  // =====================================================

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  // =====================================================
  // DELETE
  // =====================================================

  const [deleteLoading, setDeleteLoading] = useState(false);

  // =====================================================
  // EDIT
  // =====================================================

  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  const [editSaving, setEditSaving] = useState(false);

  // =====================================================
  // CATEGORY / BRAND
  // =====================================================

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);

  // =====================================================
  // CUSTOM CATEGORY / BRAND / AUDIENCE
  // =====================================================

  const [customCategory, setCustomCategory] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customAudience, setCustomAudience] = useState("");

  // =====================================================
  // IMAGE EDIT STATE
  // =====================================================

  const [editImages, setEditImages] = useState([]);

  const [imageUrlInput, setImageUrlInput] = useState("");

  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  // =====================================================
  // GET IMAGE URL
  // =====================================================

  const getImageUrl = useCallback((image) => {
    if (!image) {
      return "";
    }

    // ---------------------------------------------------
    // ARRAY
    // ---------------------------------------------------

    if (Array.isArray(image)) {
      if (image.length === 0) {
        return "";
      }

      return getImageUrl(image[0]);
    }

    // ---------------------------------------------------
    // OBJECT
    // ---------------------------------------------------

    if (typeof image === "object") {
      return getImageUrl(
        image.url ||
          image.ImageURL ||
          image.imageURL ||
          image.path ||
          image.src ||
          image.image ||
          "",
      );
    }

    // ---------------------------------------------------
    // STRING
    // ---------------------------------------------------

    if (typeof image !== "string") {
      return "";
    }

    let cleanImage = image.trim();

    if (!cleanImage) {
      return "";
    }

    // ---------------------------------------------------
    // JSON ARRAY STRING
    // ---------------------------------------------------

    if (
      (cleanImage.startsWith("[") && cleanImage.endsWith("]")) ||
      (cleanImage.startsWith("{") && cleanImage.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(cleanImage);

        if (Array.isArray(parsed)) {
          return getImageUrl(parsed[0]);
        }

        if (typeof parsed === "object") {
          return getImageUrl(parsed);
        }
      } catch {
        // Continue as normal string
      }
    }

    // ---------------------------------------------------
    // FULL URL
    // ---------------------------------------------------

    if (
      cleanImage.startsWith("http://") ||
      cleanImage.startsWith("https://") ||
      cleanImage.startsWith("data:")
    ) {
      return cleanImage;
    }

    // ---------------------------------------------------
    // /uploads/...
    // ---------------------------------------------------

    if (cleanImage.startsWith("/uploads/")) {
      return `${SERVER_URL}${cleanImage}`;
    }

    // ---------------------------------------------------
    // uploads/...
    // ---------------------------------------------------

    if (cleanImage.startsWith("uploads/")) {
      return `${SERVER_URL}/${cleanImage}`;
    }

    // ---------------------------------------------------
    // filename only
    // ---------------------------------------------------

    if (!cleanImage.startsWith("/") && !cleanImage.includes("://")) {
      if (
        cleanImage.endsWith(".jpg") ||
        cleanImage.endsWith(".jpeg") ||
        cleanImage.endsWith(".png") ||
        cleanImage.endsWith(".webp") ||
        cleanImage.endsWith(".gif")
      ) {
        return `${SERVER_URL}/uploads/${cleanImage}`;
      }
    }

    return cleanImage;
  }, []);

  // =====================================================
  // GET ALL PRODUCT IMAGES
  // =====================================================

  const getProductImages = useCallback(
    (product) => {
      if (!product) {
        return [];
      }

      let images = [];

      const addImages = (value) => {
        if (!value) {
          return;
        }

        if (Array.isArray(value)) {
          images.push(...value);
          return;
        }

        if (typeof value === "string") {
          const trimmed = value.trim();

          if (!trimmed) {
            return;
          }

          // Try JSON array
          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmed);

              if (Array.isArray(parsed)) {
                images.push(...parsed);
                return;
              }
            } catch {
              // normal string
            }
          }

          // Multiple URLs separated by newline
          if (trimmed.includes("\n")) {
            images.push(
              ...trimmed
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            );

            return;
          }

          // Multiple URLs separated by comma
          if (trimmed.includes(",http") || trimmed.includes(", http")) {
            images.push(
              ...trimmed
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            );

            return;
          }

          images.push(value);
          return;
        }

        images.push(value);
      };

      addImages(product.ImageURL);
      addImages(product.Images);
      addImages(product.images);
      addImages(product.image);

      const validImages = images
        .map((image) => getImageUrl(image))
        .filter(Boolean);

      return [...new Set(validImages)];
    },
    [getImageUrl],
  );

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load products.");
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.data)
            ? data.data
            : [],
      );
    } catch (err) {
      console.error("Load Products Error:", err);

      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const response = await fetch(`${API}/categories`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load categories.");
      }

      setCategories(
        Array.isArray(data.categories)
          ? data.categories
          : Array.isArray(data.data)
            ? data.data
            : [],
      );
    } catch (err) {
      console.error("Load Categories Error:", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // =====================================================
  // LOAD BRANDS
  // =====================================================

  const loadBrands = useCallback(async () => {
    try {
      setBrandsLoading(true);

      const response = await fetch(`${API}/brands`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load brands.");
      }

      setBrands(
        Array.isArray(data.brands)
          ? data.brands
          : Array.isArray(data.data)
            ? data.data
            : [],
      );
    } catch (err) {
      console.error("Load Brands Error:", err);
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, [loadProducts, loadCategories, loadBrands]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter((product) => {
      const searchableText = `
        ${product.ProductID || ""}
        ${product.ProductCode || ""}
        ${product.Barcode || ""}
        ${product.ProductName || ""}
        ${product.CategoryName || ""}
        ${product.BrandName || ""}
        ${product.ProductType || ""}
        ${product.Color || ""}
        ${product.Size || ""}
        ${product.Description || ""}
      `.toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [products, search]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalProducts = products.length;

  const frameProducts = products.filter((product) => {
    const category = String(
      product.CategoryName || product.ProductType || "",
    ).toLowerCase();

    return category.includes("frame") || category.includes("optical");
  }).length;

  const lensProducts = products.filter((product) => {
    const category = String(
      product.CategoryName || product.ProductType || "",
    ).toLowerCase();

    return category.includes("lens") || category.includes("contact");
  }).length;

  // =====================================================
  // PRODUCT HELPERS
  // =====================================================

  const getProductId = (product) => {
    return product.ProductCode || `PRD-${product.ProductID}`;
  };

  const getProductName = (product) => {
    return product.ProductName || "Unnamed Product";
  };

  const getCategory = (product) => {
    return product.CategoryName || product.ProductType || "Other";
  };

  const getBrand = (product) => {
    return product.BrandName || "Generic";
  };

  const getStock = (product) => {
    return Number(
      product.Stock ?? product.Quantity ?? product.StockQuantity ?? 0,
    );
  };

  const getPrice = (product) => {
    const price =
      product.LastPurchasePrice ?? product.Price ?? product.SellingPrice ?? 0;

    const numericPrice = Number(price) || 0;

    return numericPrice.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  // =====================================================
  // VIEW PRODUCT
  // =====================================================

  const handleView = (product) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setImagePreviewOpen(false);
  };

  // =====================================================
  // IMAGE PREVIEW
  // =====================================================

  const openImagePreview = (product, index = 0) => {
    setSelectedProduct(product);
    setSelectedImageIndex(index);
    setImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setImagePreviewOpen(false);
    setSelectedImageIndex(0);
  };

  const nextImage = () => {
    if (!selectedProduct) {
      return;
    }

    const images = getProductImages(selectedProduct);

    if (images.length <= 1) {
      return;
    }

    setSelectedImageIndex((currentIndex) => (currentIndex + 1) % images.length);
  };

  const previousImage = () => {
    if (!selectedProduct) {
      return;
    }

    const images = getProductImages(selectedProduct);

    if (images.length <= 1) {
      return;
    }

    setSelectedImageIndex((currentIndex) =>
      currentIndex === 0 ? images.length - 1 : currentIndex - 1,
    );
  };

  // =====================================================
  // KEYBOARD IMAGE NAVIGATION
  // =====================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!imagePreviewOpen) {
        return;
      }

      if (event.key === "Escape") {
        closeImagePreview();
      }

      if (event.key === "ArrowRight") {
        nextImage();
      }

      if (event.key === "ArrowLeft") {
        previousImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imagePreviewOpen, selectedProduct]);

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDelete = async (product) => {
    const productId = product.ProductID;

    const productName = product.ProductName || "this product";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await fetch(`${API}/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete product.");
      }

      setProducts((previousProducts) =>
        previousProducts.filter((item) => item.ProductID !== productId),
      );

      if (selectedProduct?.ProductID === productId) {
        setSelectedProduct(null);
      }

      alert("Product deleted successfully.");
    } catch (err) {
      console.error("Delete Product Error:", err);

      alert(err.message || "Unable to delete product.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (product) => {
    const images = getProductImages(product);

    setEditingProduct({
      ...product,

      ProductName: product.ProductName || "",

      ProductCode: product.ProductCode || "",

      Barcode: product.Barcode || "",

      ProductType: product.ProductType || "",

      CategoryID: product.CategoryID ?? "",

      BrandID: product.BrandID ?? "",

      Description: product.Description || "",

      ModelNumber: product.ModelNumber || "",

      Color: product.Color || "",

      Size: product.Size || "",

      StockQuantity:
        product.StockQuantity ?? product.Stock ?? product.Quantity ?? 0,

      Price: product.Price ?? product.LastPurchasePrice ?? 0,
    });

    setEditImages(
      images.map((url) => ({
        id: `existing-${Date.now()}-${Math.random()}`,
        url,
        type: "existing",
      })),
    );

    setImageUrlInput("");
    setCustomCategory("");
    setCustomBrand("");
    setCustomAudience("");
    setIsAddMode(false);
    setEditModalOpen(true);
    setSelectedProduct(null);
    setImagePreviewOpen(false);
  };

  // =====================================================
  // CLOSE EDIT MODAL
  // =====================================================

  const closeEditModal = () => {
    if (editSaving) {
      return;
    }

    setEditModalOpen(false);
    setEditingProduct(null);
    setIsAddMode(false);
    setEditImages([]);
    setImageUrlInput("");
    setCustomCategory("");
    setCustomBrand("");
    setCustomAudience("");
    setDragActive(false);
  };

  // =====================================================
  // CHANGE EDIT FIELD
  // =====================================================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditingProduct((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // VALIDATE FILE
  // =====================================================

  const validateImageFile = (file) => {
    if (!file) {
      return false;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Only JPG, PNG, WEBP and GIF images are allowed.");

      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Each image must be maximum 5 MB.");

      return false;
    }

    return true;
  };

  // =====================================================
  // ADD FILES TO EDIT IMAGES
  // =====================================================

  const addImageFiles = (files) => {
    if (!files || files.length === 0) {
      return;
    }

    const currentCount = editImages.length;

    const remaining = MAX_IMAGES - currentCount;

    if (remaining <= 0) {
      alert(`Maximum ${MAX_IMAGES} images are allowed.`);

      return;
    }

    const selectedFiles = Array.from(files).slice(0, remaining);

    const validFiles = selectedFiles.filter(validateImageFile);

    const newImages = validFiles.map((file) => ({
      id: `new-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      type: "new",
    }));

    setEditImages((previous) => [...previous, ...newImages]);
  };

  // =====================================================
  // FILE INPUT
  // =====================================================

  const handleFileInput = (event) => {
    addImageFiles(event.target.files);

    event.target.value = "";
  };

  // =====================================================
  // DRAG EVENTS
  // =====================================================

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    addImageFiles(event.dataTransfer.files);
  };

  // =====================================================
  // ADD IMAGE URL
  // =====================================================

  const addImageUrl = () => {
    const url = imageUrlInput.trim();

    if (!url) {
      alert("Please enter an image URL.");

      return;
    }

    if (editImages.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images are allowed.`);

      return;
    }

    setEditImages((previous) => [
      ...previous,
      {
        id: `url-${Date.now()}-${Math.random()}`,
        url,
        type: "url",
      },
    ]);

    setImageUrlInput("");
  };

  // =====================================================
  // REMOVE EDIT IMAGE
  // =====================================================

  const removeEditImage = (id) => {
    setEditImages((previous) => previous.filter((image) => image.id !== id));
  };

  // =====================================================
  // UPLOAD SINGLE IMAGE
  // =====================================================

  const uploadSingleImage = async (file) => {
    const formData = new FormData();

    formData.append("image", file);

    const response = await fetch(`${API}/upload-image`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to upload image.");
    }

    // Support different backend response shapes
    return (
      data.url ||
      data.imageUrl ||
      data.imageURL ||
      data.ImageURL ||
      data.image ||
      data.path ||
      data.data?.url ||
      data.data?.imageUrl ||
      data.data?.imageURL ||
      data.data?.ImageURL ||
      data.data?.image ||
      ""
    );
  };

  // =====================================================
  // PREPARE IMAGES FOR DATABASE
  // =====================================================

  const prepareImagesForDatabase = async () => {
    const finalImages = [];

    for (const image of editImages) {
      if (image.type === "new" && image.file) {
        const uploadedUrl = await uploadSingleImage(image.file);

        if (!uploadedUrl) {
          throw new Error(
            "Image uploaded but server did not return image URL.",
          );
        }

        // Replace the local preview URL with the real server URL.
        image.url = uploadedUrl;
        finalImages.push(uploadedUrl);
      } else {
        const url = image.url || "";

        if (url) {
          finalImages.push(url);
        }
      }
    }

    return [...new Set(finalImages)];
  };

  // =====================================================
  // CUSTOM FIELD HELPERS
  // =====================================================

  const isOtherCategory =
    String(editingProduct?.CategoryID || "") === "__OTHER__";

  const isOtherBrand =
    String(editingProduct?.BrandID || "") === "__OTHER__";

  const isOtherAudience =
    String(editingProduct?.TargetAudience || "") === "Other";

  const resolveAudience = () => {
    if (!editingProduct) {
      return "";
    }

    return isOtherAudience
      ? customAudience.trim()
      : editingProduct.TargetAudience || "";
  };

  // =====================================================
  // SAVE PRODUCT - ADD / EDIT
  // =====================================================

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    if (!editingProduct.ProductName?.trim()) {
      alert("Product Name is required.");
      return;
    }

    if (!editingProduct.CategoryID) {
      alert("Please select a category.");
      return;
    }

    if (isOtherCategory && !customCategory.trim()) {
      alert("Please enter a custom category.");
      return;
    }

    if (isOtherBrand && !customBrand.trim()) {
      alert("Please enter a custom brand.");
      return;
    }

    if (isOtherAudience && !customAudience.trim()) {
      alert("Please enter who this product is for.");
      return;
    }

    try {
      setEditSaving(true);

      // Upload local files first.
      const allImages = await prepareImagesForDatabase();

      // -------------------------------------------------
      // ADD PRODUCT
      // -------------------------------------------------
      if (isAddMode) {
        const payload = {
          ProductCode: editingProduct.ProductCode?.trim() || null,
          Barcode: editingProduct.Barcode?.trim() || null,
          ProductName: editingProduct.ProductName.trim(),
          CategoryID: isOtherCategory
            ? null
            : Number(editingProduct.CategoryID),
          CategoryName: isOtherCategory
            ? customCategory.trim()
            : null,
          BrandID:
            isOtherBrand || !editingProduct.BrandID
              ? null
              : Number(editingProduct.BrandID),
          BrandName: isOtherBrand
            ? customBrand.trim()
            : null,
          ProductType: editingProduct.ProductType || null,
          TargetAudience: resolveAudience() || null,
          Description: editingProduct.Description?.trim() || null,
          ModelNumber: editingProduct.ModelNumber?.trim() || null,
          Color: editingProduct.Color?.trim() || null,
          Size: editingProduct.Size?.trim() || null,
          Quantity:
            editingProduct.StockQuantity !== "" &&
            editingProduct.StockQuantity !== null &&
            editingProduct.StockQuantity !== undefined
              ? Number(editingProduct.StockQuantity)
              : 0,
          StockQuantity:
            editingProduct.StockQuantity !== "" &&
            editingProduct.StockQuantity !== null &&
            editingProduct.StockQuantity !== undefined
              ? Number(editingProduct.StockQuantity)
              : 0,
          Stock:
            editingProduct.StockQuantity !== "" &&
            editingProduct.StockQuantity !== null &&
            editingProduct.StockQuantity !== undefined
              ? Number(editingProduct.StockQuantity)
              : 0,
          LastPurchasePrice:
            editingProduct.Price !== "" &&
            editingProduct.Price !== null &&
            editingProduct.Price !== undefined
              ? Number(editingProduct.Price)
              : 0,
          Price:
            editingProduct.Price !== "" &&
            editingProduct.Price !== null &&
            editingProduct.Price !== undefined
              ? Number(editingProduct.Price)
              : 0,
          ImageURL: allImages[0] || null,
          Images: allImages,
        };

        console.log("Creating product:", payload);

        const response = await fetch(API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Unable to create product.",
          );
        }

        closeEditModal();
        await loadProducts();
        alert("Product added successfully.");
        return;
      }

      // -------------------------------------------------
      // EDIT PRODUCT
      // -------------------------------------------------

      // Existing images are already in the database.
      // Only send newly added URL/file images to avoid duplicates.
      const newImages = editImages
        .filter((image) => image.type !== "existing")
        .map((image) => getImageUrl(image.url))
        .filter(Boolean);

      const payload = {
        ProductCode: editingProduct.ProductCode || null,
        Barcode: editingProduct.Barcode || null,
        ProductName: editingProduct.ProductName.trim(),
        CategoryID: isOtherCategory
          ? null
          : Number(editingProduct.CategoryID),
        CategoryName: isOtherCategory
          ? customCategory.trim()
          : null,
        BrandID:
          isOtherBrand || !editingProduct.BrandID
            ? null
            : Number(editingProduct.BrandID),
        BrandName: isOtherBrand
          ? customBrand.trim()
          : null,
        ProductType: editingProduct.ProductType || null,
        TargetAudience: resolveAudience() || null,
        Description: editingProduct.Description || null,
        ModelNumber: editingProduct.ModelNumber || null,
        Color: editingProduct.Color || null,
        Size: editingProduct.Size || null,
        Quantity:
          editingProduct.StockQuantity !== ""
            ? Number(editingProduct.StockQuantity) || 0
            : 0,
        LastPurchasePrice:
          editingProduct.Price !== ""
            ? Number(editingProduct.Price) || 0
            : 0,
        ImageURL: allImages[0] || null,
        Images: newImages,
      };

      console.log("Updating product:", editingProduct.ProductID);
      console.log("Update payload:", payload);

      const response = await fetch(`${API}/${editingProduct.ProductID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to update product.",
        );
      }

      closeEditModal();
      await loadProducts();
      alert("Product updated successfully.");
    } catch (err) {
      console.error(
        isAddMode ? "Create Product Error:" : "Update Product Error:",
        err,
      );

      alert(err.message || "Unable to save product.");
    } finally {
      setEditSaving(false);
    }
  };

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const handleAddProduct = () => {
    setEditingProduct({
      ProductID: null,
      ProductCode: "",
      Barcode: "",
      ProductName: "",
      ProductType: "",
      CategoryID: "",
      BrandID: "",
      TargetAudience: "",
      Description: "",
      ModelNumber: "",
      Color: "",
      Size: "",
      StockQuantity: 0,
      Price: "",
    });

    setEditImages([]);
    setImageUrlInput("");
    setCustomCategory("");
    setCustomBrand("");
    setCustomAudience("");
    setDragActive(false);
    setIsAddMode(true);
    setEditModalOpen(true);
    setSelectedProduct(null);
    setImagePreviewOpen(false);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="products-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-top">
        <div>
          <h1>Products</h1>

          <p>Manage frames, lenses and other optical products.</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={handleAddProduct}
        >
          <Plus size={17} />
          Add Product
        </button>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="product-summary">
        <div className="summary-card">
          <div className="summary-icon blue">
            <Package size={21} />
          </div>

          <div className="summary-content">
            <span>Total Products</span>

            <strong>{totalProducts.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon green">
            <Glasses size={21} />
          </div>

          <div className="summary-content">
            <span>Frames</span>

            <strong>{frameProducts.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange">
            <Package size={21} />
          </div>

          <div className="summary-content">
            <span>Lenses</span>

            <strong>{lensProducts.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="products-error">
          <div>
            <strong>Unable to load products</strong>

            <p>{error}</p>
          </div>

          <button type="button" onClick={loadProducts}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          PRODUCT CATALOG
      ================================================= */}

      <div className="content-card">
        <div className="table-toolbar">
          <div>
            <h2>Product Catalog</h2>

            <span>
              {products.length === 0
                ? "No products available."
                : `${products.length} product${
                    products.length === 1 ? "" : "s"
                  } available in your store.`}
            </span>
          </div>

          <div className="search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="products-loading">
            <RefreshCw size={28} className="loading-spinner" />

            <p>Loading products...</p>
          </div>
        ) : (
          <>
            {/* =================================================
                TABLE
            ================================================= */}

            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>IMAGE</th>

                    <th>PRODUCT ID</th>

                    <th>PRODUCT</th>

                    <th>CATEGORY</th>

                    <th>BRAND</th>

                    <th>COLOR</th>

                    <th>PRICE</th>

                    <th>STOCK</th>

                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const productImages = getProductImages(product);

                    const imageUrl = productImages[0] || "";

                    const stock = getStock(product);

                    return (
                      <tr key={product.ProductID}>
                        {/* IMAGE */}

                        <td>
                          <div
                            className={
                              imageUrl
                                ? "product-image clickable"
                                : "product-image"
                            }
                            onClick={() => {
                              if (productImages.length > 0) {
                                openImagePreview(product, 0);
                              }
                            }}
                            title={imageUrl ? "Click to view images" : ""}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={getProductName(product)}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <Package size={20} />
                            )}

                            {productImages.length > 1 && (
                              <span className="image-count">
                                +{productImages.length - 1}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PRODUCT ID */}

                        <td>
                          <span className="product-code">
                            {getProductId(product)}
                          </span>
                        </td>

                        {/* PRODUCT */}

                        <td>
                          <strong className="product-title">
                            {getProductName(product)}
                          </strong>
                        </td>

                        {/* CATEGORY */}

                        <td>
                          <span className="category-badge">
                            {getCategory(product)}
                          </span>
                        </td>

                        {/* BRAND */}

                        <td>{getBrand(product)}</td>

                        {/* COLOR */}

                        <td>
                          <div className="color-cell">
                            <span
                              className="color-dot"
                              title={product.Color || "Unknown"}
                            />

                            <span>{product.Color || "—"}</span>
                          </div>
                        </td>

                        {/* PRICE */}

                        <td className="amount">{getPrice(product)}</td>

                        {/* STOCK */}

                        <td>
                          <span
                            className={stock <= 10 ? "stock-low" : "stock-good"}
                          >
                            {stock}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td>
                          <div className="action-buttons">
                            {/* VIEW */}

                            <button
                              type="button"
                              title="View Product"
                              onClick={() => handleView(product)}
                            >
                              <Eye size={15} />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              title="Edit Product"
                              onClick={() => openEditModal(product)}
                            >
                              <Pencil size={15} />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              title="Delete Product"
                              disabled={deleteLoading}
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =================================================
                NO PRODUCTS
            ================================================= */}

            {filteredProducts.length === 0 && (
              <div className="no-products">
                <Package size={35} />

                <h3>
                  {search ? "No products found" : "No products available"}
                </h3>

                <p>
                  {search
                    ? "Try changing your search."
                    : "Add your first product to get started."}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          PRODUCT DETAILS MODAL
      ===================================================== */}

      {selectedProduct && !imagePreviewOpen && (
        <div
          className="product-modal-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedProduct(null)}
            >
              <X size={19} />
            </button>

            <div className="product-modal-image">
              {getProductImages(selectedProduct).length > 0 ? (
                <img
                  src={getProductImages(selectedProduct)[0]}
                  alt={getProductName(selectedProduct)}
                  onClick={() => openImagePreview(selectedProduct, 0)}
                />
              ) : (
                <ImageIcon size={50} />
              )}
            </div>

            <div className="product-modal-content">
              <h2>{getProductName(selectedProduct)}</h2>

              <p className="modal-product-code">
                {getProductId(selectedProduct)}
              </p>

              <div className="product-detail-grid">
                <div>
                  <span>Category</span>

                  <strong>{getCategory(selectedProduct)}</strong>
                </div>

                <div>
                  <span>Brand</span>

                  <strong>{getBrand(selectedProduct)}</strong>
                </div>

                <div>
                  <span>Color</span>

                  <strong>{selectedProduct.Color || "—"}</strong>
                </div>

                <div>
                  <span>Size</span>

                  <strong>{selectedProduct.Size || "—"}</strong>
                </div>

                <div>
                  <span>Stock</span>

                  <strong>{getStock(selectedProduct)}</strong>
                </div>

                <div>
                  <span>Price</span>

                  <strong>{getPrice(selectedProduct)}</strong>
                </div>
              </div>

              {selectedProduct.Description && (
                <div className="product-description">
                  <span>Description</span>

                  <p>{selectedProduct.Description}</p>
                </div>
              )}

              <div className="modal-image-count">
                <ImageIcon size={16} />
                {getProductImages(selectedProduct).length} image
                {getProductImages(selectedProduct).length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          FULL IMAGE PREVIEW
      ===================================================== */}

      {imagePreviewOpen && selectedProduct && (
        <div className="image-preview-overlay" onClick={closeImagePreview}>
          <button
            type="button"
            className="image-preview-close"
            onClick={closeImagePreview}
          >
            <X size={25} />
          </button>

          {getProductImages(selectedProduct).length > 1 && (
            <button
              type="button"
              className="image-nav previous"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
            >
              <ChevronLeft size={30} />
            </button>
          )}

          <div
            className="image-preview-content"
            onClick={(event) => event.stopPropagation()}
          >
            {getProductImages(selectedProduct).length > 0 ? (
              <img
                src={getProductImages(selectedProduct)[selectedImageIndex]}
                alt={getProductName(selectedProduct)}
              />
            ) : (
              <div className="preview-no-image">
                <ImageIcon size={60} />

                <p>No image available</p>
              </div>
            )}

            <div className="image-preview-caption">
              <strong>{getProductName(selectedProduct)}</strong>

              <span>
                {selectedImageIndex + 1}
                {" / "}
                {getProductImages(selectedProduct).length}
              </span>
            </div>
          </div>

          {getProductImages(selectedProduct).length > 1 && (
            <button
              type="button"
              className="image-nav next"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight size={30} />
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          EDIT PRODUCT MODAL
      ===================================================== */}

      {editModalOpen && editingProduct && (
        <div className="edit-product-overlay" onClick={closeEditModal}>
          <div
            className="edit-product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="edit-modal-header">
              <div>
                <h2>{isAddMode ? "Add Product" : "Edit Product"}</h2>

                <p>
                  {isAddMode
                    ? "Add a new optical product to your inventory."
                    : "Update product information and images."}
                </p>
              </div>

              <button
                type="button"
                className="edit-close-btn"
                onClick={closeEditModal}
                disabled={editSaving}
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleEditSubmit} className="edit-product-form">
              {/* =================================================
                  PRODUCT ID
              ================================================= */}

              {!isAddMode && (
                <div className="edit-product-id-box">
                  <div>
                    <span>Product ID</span>

                    <strong>{editingProduct.ProductID}</strong>
                  </div>

                  <div>
                    <span>Product Code</span>

                    <strong>{editingProduct.ProductCode || "—"}</strong>
                  </div>
                </div>
              )}

              {/* =================================================
                  BASIC INFORMATION
              ================================================= */}

              <div className="edit-section">
                <h3>Basic Information</h3>

                <div className="edit-grid">
                  <div className="edit-field">
                    <label>Product Name *</label>

                    <input
                      type="text"
                      name="ProductName"
                      value={editingProduct.ProductName}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="edit-field">
                    <label>Product Code</label>

                    <input
                      type="text"
                      name="ProductCode"
                      value={editingProduct.ProductCode}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Barcode</label>

                    <input
                      type="text"
                      name="Barcode"
                      value={editingProduct.Barcode}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Product Type</label>

                    <select
                      name="ProductType"
                      value={editingProduct.ProductType}
                      onChange={handleEditChange}
                    >
                      <option value="">Select Product Type</option>

                      <option value="Optical Frames">Optical Frames</option>

                      <option value="Sunglasses">Sunglasses</option>

                      <option value="Prescription Lenses">
                        Prescription Lenses
                      </option>

                      <option value="Contact Lenses">Contact Lenses</option>

                      <option value="Accessories">Accessories</option>

                      <option value="Lens Care">Lens Care</option>
                    </select>
                  </div>

                  <div className="edit-field">
                    <label>Category *</label>

                    <select
                      name="CategoryID"
                      value={editingProduct.CategoryID}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">
                        {categoriesLoading
                          ? "Loading categories..."
                          : "Select Category"}
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.CategoryID}
                          value={category.CategoryID}
                        >
                          {category.CategoryName}
                        </option>
                      ))}

                      <option value="__OTHER__">Other</option>
                    </select>

                    {isOtherCategory && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(event) =>
                          setCustomCategory(event.target.value)
                        }
                        placeholder="Enter custom category"
                      />
                    )}
                  </div>

                  <div className="edit-field">
                    <label>Brand</label>

                    <select
                      name="BrandID"
                      value={editingProduct.BrandID}
                      onChange={handleEditChange}
                    >
                      <option value="">
                        {brandsLoading ? "Loading brands..." : "Select Brand"}
                      </option>

                      {brands.map((brand) => (
                        <option key={brand.BrandID} value={brand.BrandID}>
                          {brand.BrandName}
                        </option>
                      ))}

                      <option value="__OTHER__">Other</option>
                    </select>

                    {isOtherBrand && (
                      <input
                        type="text"
                        value={customBrand}
                        onChange={(event) =>
                          setCustomBrand(event.target.value)
                        }
                        placeholder="Enter custom brand"
                      />
                    )}
                  </div>

                  <div className="edit-field">
                    <label>For Whom *</label>

                    <select
                      name="TargetAudience"
                      value={editingProduct.TargetAudience || ""}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Select Audience</option>
                      <option value="Boy">Boy</option>
                      <option value="Girl">Girl</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Other">Other</option>
                    </select>

                    {isOtherAudience && (
                      <input
                        type="text"
                        value={customAudience}
                        onChange={(event) =>
                          setCustomAudience(event.target.value)
                        }
                        placeholder="e.g. Kids, Senior, Teenager"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================
                  PRODUCT DETAILS
              ================================================= */}

              <div className="edit-section">
                <h3>Product Details</h3>

                <div className="edit-grid">
                  <div className="edit-field">
                    <label>Model Number</label>

                    <input
                      type="text"
                      name="ModelNumber"
                      value={editingProduct.ModelNumber}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Color</label>

                    <input
                      type="text"
                      name="Color"
                      value={editingProduct.Color}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Size</label>

                    <input
                      type="text"
                      name="Size"
                      value={editingProduct.Size}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Stock Quantity</label>

                    <input
                      type="number"
                      min="0"
                      name="StockQuantity"
                      value={editingProduct.StockQuantity}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Price</label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="Price"
                      value={editingProduct.Price}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
              </div>

              {/* =================================================
                  IMAGE SECTION
              ================================================= */}

              <div className="edit-section">
                <div className="edit-section-heading">
                  <div>
                    <h3>Product Images</h3>

                    <p>Add up to {MAX_IMAGES} images.</p>
                  </div>

                  <span>
                    {editImages.length} / {MAX_IMAGES}
                  </span>
                </div>

                {/* IMAGE URL */}

                <div className="image-url-row">
                  <div className="image-url-input">
                    <LinkIcon size={17} />

                    <input
                      type="text"
                      placeholder="Paste image URL here..."
                      value={imageUrlInput}
                      onChange={(event) => setImageUrlInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addImageUrl();
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="image-action-btn"
                    onClick={addImageUrl}
                  >
                    <LinkIcon size={16} />
                    Add URL
                  </button>
                </div>

                {/* DRAG & DROP */}

                <div
                  className={
                    dragActive
                      ? "image-drop-zone drag-active"
                      : "image-drop-zone"
                  }
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    hidden
                    onChange={handleFileInput}
                  />

                  <div className="upload-icon">
                    <Upload size={25} />
                  </div>

                  <strong>Drag & Drop images here</strong>

                  <span>or click to browse</span>

                  <small>Up to {MAX_IMAGES} images, maximum 5 MB each</small>
                </div>

                {/* IMAGE GRID */}

                {editImages.length > 0 && (
                  <div className="edit-images-grid">
                    {editImages.map((image, index) => (
                      <div className="edit-image-card" key={image.id}>
                        <img
                          src={getImageUrl(image.url)}
                          alt={`Product ${index + 1}`}
                          onError={(event) => {
                            event.currentTarget.style.opacity = "0.25";
                          }}
                        />

                        <div className="image-card-number">{index + 1}</div>

                        <div className="image-card-type">
                          {image.type === "existing"
                            ? "Existing"
                            : image.type === "new"
                              ? "New"
                              : "URL"}
                        </div>

                        <button
                          type="button"
                          className="remove-image-btn"
                          title="Remove image"
                          onClick={() => removeEditImage(image.id)}
                        >
                          <X size={15} />
                        </button>

                        <div className="drag-handle">
                          <GripVertical size={15} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div className="edit-section">
                <div className="edit-field">
                  <label>Description</label>

                  <textarea
                    name="Description"
                    rows="4"
                    value={editingProduct.Description}
                    onChange={handleEditChange}
                    placeholder="Enter product description..."
                  />
                </div>
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="edit-modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeEditModal}
                  disabled={editSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <>
                      <RefreshCw size={16} className="loading-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {isAddMode ? "Save Product" : "Save Changes"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;