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
  X,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Save,
  Barcode,
} from "lucide-react";

import "./Products.css";
import API_BASE_URL from "../../services/api.js";

const API = `${API_BASE_URL}/products`;
const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const productImageInputRef = useRef(null);

  const [barcodeImageFile, setBarcodeImageFile] = useState(null);
  const [barcodeImagePreview, setBarcodeImagePreview] = useState("");
  const barcodeImageInputRef = useRef(null);

  // =====================================================
  // IMAGE URL HELPER
  // =====================================================

  const getImageUrl = useCallback((image) => {
    if (!image) return "";
    if (typeof image === "object") {
      return getImageUrl(
        image.url ||
          image.ImageURL ||
          image.imageURL ||
          image.path ||
          image.src ||
          image.image ||
          ""
      );
    }

    if (typeof image !== "string") return "";
    const cleanImage = image.trim();
    if (!cleanImage) return "";

    if (
      cleanImage.startsWith("http://") ||
      cleanImage.startsWith("https://") ||
      cleanImage.startsWith("data:") ||
      cleanImage.startsWith("blob:")
    ) {
      return cleanImage;
    }

    if (cleanImage.startsWith("/uploads/")) {
      return `${SERVER_URL}${cleanImage}`;
    }
    if (cleanImage.startsWith("uploads/")) {
      return `${SERVER_URL}/${cleanImage}`;
    }
    if (!cleanImage.startsWith("/")) {
      return `${SERVER_URL}/uploads/${cleanImage}`;
    }
    return cleanImage;
  }, []);

  const getProductImage = useCallback(
    (product) => {
      if (!product) return "";
      return getImageUrl(
        product.ImageURL || product.imageURL || product.image || ""
      );
    },
    [getImageUrl]
  );

  const getBarcodeImage = useCallback(
    (product) => {
      if (!product) return "";
      return getImageUrl(
        product.BarcodeImageURL ||
          product.BarcodeImage ||
          product.barcodeImageURL ||
          product.barcodeImage ||
          ""
      );
    },
    [getImageUrl]
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

      const productList = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
        ? data.data
        : [];

      setProducts(productList);
    } catch (err) {
      console.error("Load Products Error:", err);
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((product) => {
      const searchableText = `
        ${product.ProductID || ""}
        ${product.ProductCode || ""}
        ${product.ProductName || ""}
        ${product.ForWhom || ""}
        ${product.TargetAudience || ""}
      `.toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [products, search]);

  const totalProducts = products.length;

  const getProductId = (product) => {
    return product.ProductCode || `PRD-${product.ProductID}`;
  };

  const getProductName = (product) => {
    return product.ProductName || "Unnamed Product";
  };

  const getStock = (product) => {
    return Number(
      product.StockQuantity ?? product.Stock ?? product.Quantity ?? 0
    );
  };

  const getPrice = (product) => {
    const price =
      product.Price ??
      product.SellingPrice ??
      product.LastPurchasePrice ??
      0;

    return Number(price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  const getGender = (product) => {
    return product.ForWhom || product.TargetAudience || "—";
  };

  // =====================================================
  // VIEW & DELETE
  // =====================================================

  const handleView = (product) => {
    setSelectedProduct(product);
    setImagePreviewOpen(false);
  };

  const closeView = () => {
    setSelectedProduct(null);
    setImagePreviewOpen(false);
  };

  const openImagePreview = (product) => {
    setSelectedProduct(product);
    setImagePreviewOpen(true);
  };

  const handleDelete = async (product) => {
    const productId = product.ProductID;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${getProductName(product)}"?`
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`${API}/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete product.");
      }

      setProducts((previous) =>
        previous.filter((item) => item.ProductID !== productId)
      );

      if (selectedProduct?.ProductID === productId) {
        closeView();
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
  // ADD & EDIT MODAL HANDLERS
  // =====================================================

  const handleAddProduct = () => {
    setEditingProduct({
      ProductID: null,
      ProductCode: "",
      ProductName: "",
      ForWhom: "",
      Price: "",
      StockQuantity: 0,
      ImageURL: "",
      BarcodeImageURL: "",
    });

    setProductImageFile(null);
    setProductImagePreview("");
    setBarcodeImageFile(null);
    setBarcodeImagePreview("");

    if (productImageInputRef.current) productImageInputRef.current.value = "";
    if (barcodeImageInputRef.current) barcodeImageInputRef.current.value = "";

    setIsAddMode(true);
    setEditModalOpen(true);
    setSelectedProduct(null);
    setImagePreviewOpen(false);
  };

  const openEditModal = (product) => {
    setEditingProduct({
      ProductID: product.ProductID,
      ProductCode: product.ProductCode || "",
      ProductName: product.ProductName || "",
      ForWhom: product.ForWhom || product.TargetAudience || "",
      Price:
        product.Price ??
        product.SellingPrice ??
        product.LastPurchasePrice ??
        0,
      StockQuantity:
        product.StockQuantity ?? product.Stock ?? product.Quantity ?? 0,
      ImageURL: product.ImageURL || "",
      BarcodeImageURL: product.BarcodeImageURL || product.BarcodeImage || "",
    });

    setProductImageFile(null);
    setProductImagePreview(getProductImage(product));

    setBarcodeImageFile(null);
    setBarcodeImagePreview(getBarcodeImage(product));

    setIsAddMode(false);
    setEditModalOpen(true);
    closeView();
  };

  const closeEditModal = () => {
    if (editSaving) return;

    setEditModalOpen(false);
    setEditingProduct(null);
    setIsAddMode(false);

    setProductImageFile(null);
    setProductImagePreview("");
    setBarcodeImageFile(null);
    setBarcodeImagePreview("");

    if (productImageInputRef.current) productImageInputRef.current.value = "";
    if (barcodeImageInputRef.current) barcodeImageInputRef.current.value = "";
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditingProduct((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // IMAGE HANDLERS
  // =====================================================

  const validateImage = (file) => {
    if (!file) return false;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Only JPG, PNG, WEBP and GIF images are allowed.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("Image size must be maximum 5 MB.");
      return false;
    }

    return true;
  };

  const handleProductImage = (event) => {
    const file = event.target.files?.[0];
    if (!file || !validateImage(file)) return;

    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));

    setEditingProduct((previous) => ({
      ...previous,
      ImageURL: "",
    }));
  };

  const handleBarcodeImage = (event) => {
    const file = event.target.files?.[0];
    if (!file || !validateImage(file)) return;

    setBarcodeImageFile(file);
    setBarcodeImagePreview(URL.createObjectURL(file));

    setEditingProduct((previous) => ({
      ...previous,
      BarcodeImageURL: "",
    }));
  };

  const removeProductImage = () => {
    setProductImageFile(null);
    setProductImagePreview("");
    setEditingProduct((previous) => ({
      ...previous,
      ImageURL: "",
    }));

    if (productImageInputRef.current) productImageInputRef.current.value = "";
  };

  const removeBarcodeImage = () => {
    setBarcodeImageFile(null);
    setBarcodeImagePreview("");
    setEditingProduct((previous) => ({
      ...previous,
      BarcodeImageURL: "",
    }));

    if (barcodeImageInputRef.current) barcodeImageInputRef.current.value = "";
  };

  const uploadImage = async (file) => {
    if (!file) return "";

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

    const imageUrl =
      data.imageURL ||
      data.image ||
      data.url ||
      data.data?.imageURL ||
      data.data?.image ||
      data.data?.url ||
      "";

    if (!imageUrl) {
      throw new Error("Image uploaded but server did not return image URL.");
    }

    return imageUrl;
  };

  // =====================================================
  // SUBMIT (ADD & EDIT)
  // =====================================================

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingProduct) return;

    if (!editingProduct.ProductName || !editingProduct.ProductName.trim()) {
      alert("Product Name is required.");
      return;
    }

    if (!editingProduct.ForWhom) {
      alert("Please select For Whom / Gender.");
      return;
    }

    if (editingProduct.Price === "" || Number(editingProduct.Price) < 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (
      editingProduct.StockQuantity === "" ||
      Number(editingProduct.StockQuantity) < 0
    ) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    try {
      setEditSaving(true);

      let finalProductImage = editingProduct.ImageURL || null;
      if (productImageFile) {
        finalProductImage = await uploadImage(productImageFile);
      }

      let finalBarcodeImage = editingProduct.BarcodeImageURL || null;
      if (barcodeImageFile) {
        finalBarcodeImage = await uploadImage(barcodeImageFile);
      }

      const payload = {
        ProductName: editingProduct.ProductName.trim(),
        ForWhom: editingProduct.ForWhom,
        Price: Number(editingProduct.Price),
        StockQuantity: Number(editingProduct.StockQuantity),
        ImageURL: finalProductImage,
        BarcodeImageURL: finalBarcodeImage,
      };

      const response = await fetch(
        isAddMode ? API : `${API}/${editingProduct.ProductID}`,
        {
          method: isAddMode ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to save product."
        );
      }

      closeEditModal();
      await loadProducts();

      alert(
        isAddMode
          ? "Product added successfully."
          : "Product updated successfully."
      );
    } catch (err) {
      console.error("Product Save Error:", err);
      alert(err.message || "Unable to save product.");
    } finally {
      setEditSaving(false);
    }
  };

  // =====================================================
  // RENDER UI
  // =====================================================

  return (
    <div className="products-page">
      {/* HEADER */}
      <div className="page-top">
        <div>
          <h1>Products</h1>
          <p>Manage your optical products and stock.</p>
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

      {/* SUMMARY CARD */}
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
      </div>

      {/* ERROR */}
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

      {/* TABLE */}
      <div className="content-card">
        <div className="table-toolbar">
          <div>
            <h2>Product Catalog</h2>
            <span>
              {products.length} product{products.length === 1 ? "" : "s"} available.
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

        {loading ? (
          <div className="products-loading">
            <RefreshCw size={28} className="loading-spinner" />
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>IMAGE</th>
                    <th>PRODUCT CODE</th>
                    <th>PRODUCT</th>
                    <th>GENDER</th>
                    <th>PRICE</th>
                    <th>STOCK</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const image = getProductImage(product);
                    const stock = getStock(product);

                    return (
                      <tr key={product.ProductID}>
                        <td>
                          <div
                            className={image ? "product-image clickable" : "product-image"}
                            onClick={() => {
                              if (image) openImagePreview(product);
                            }}
                          >
                            {image ? (
                              <img src={image} alt={getProductName(product)} />
                            ) : (
                              <Package size={20} />
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="product-code">
                            {getProductId(product)}
                          </span>
                        </td>
                        <td>
                          <strong className="product-title">
                            {getProductName(product)}
                          </strong>
                        </td>
                        <td>{getGender(product)}</td>
                        <td className="amount">{getPrice(product)}</td>
                        <td>
                          <span className={stock <= 10 ? "stock-low" : "stock-good"}>
                            {stock}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              title="View"
                              onClick={() => handleView(product)}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => openEditModal(product)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
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

            {filteredProducts.length === 0 && (
              <div className="no-products">
                <Package size={35} />
                <h3>{search ? "No products found" : "No products available"}</h3>
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

      {/* VIEW PRODUCT MODAL */}
      {selectedProduct && !imagePreviewOpen && (
        <div className="product-modal-overlay" onClick={closeView}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeView}>
              <X size={19} />
            </button>

            <div className="product-modal-image">
              {getProductImage(selectedProduct) ? (
                <img
                  src={getProductImage(selectedProduct)}
                  alt={getProductName(selectedProduct)}
                  onClick={() => openImagePreview(selectedProduct)}
                />
              ) : (
                <ImageIcon size={50} />
              )}
            </div>

            <div className="product-modal-content">
              <h2>{getProductName(selectedProduct)}</h2>
              <p className="modal-product-code">{getProductId(selectedProduct)}</p>

              <div className="product-detail-grid">
                <div>
                  <span>For Whom</span>
                  <strong>{getGender(selectedProduct)}</strong>
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

              <div className="barcode-preview-box">
                <div className="barcode-preview-heading">
                  <Barcode size={18} />
                  <span>Barcode</span>
                </div>
                {getBarcodeImage(selectedProduct) ? (
                  <img
                    src={getBarcodeImage(selectedProduct)}
                    alt="Product barcode"
                  />
                ) : (
                  <span className="no-barcode">No barcode image</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {imagePreviewOpen && selectedProduct && (
        <div
          className="image-preview-overlay"
          onClick={() => setImagePreviewOpen(false)}
        >
          <button
            type="button"
            className="image-preview-close"
            onClick={() => setImagePreviewOpen(false)}
          >
            <X size={25} />
          </button>
          <div
            className="image-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            {getProductImage(selectedProduct) ? (
              <img
                src={getProductImage(selectedProduct)}
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
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {editModalOpen && editingProduct && (
        <div className="edit-product-overlay" onClick={closeEditModal}>
          <div
            className="edit-product-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-modal-header">
              <div>
                <h2>{isAddMode ? "Add Product" : "Edit Product"}</h2>
                <p>
                  {isAddMode
                    ? "Enter basic product information."
                    : "Update product information."}
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

            <form onSubmit={handleEditSubmit} className="edit-product-form">
              <div className="automatic-code-box">
                <div>
                  <span>Product Code</span>
                  <strong>
                    {isAddMode
                      ? "Will be generated automatically"
                      : editingProduct.ProductCode || "—"}
                  </strong>
                </div>
                <small>Automatically generated</small>
              </div>

              {/* PRODUCT IMAGE UPLOAD */}
              <div className="upload-section">
                <label>Product Image 🖼️</label>
                <div className="single-image-upload">
                  {productImagePreview ? (
                    <div className="single-image-preview">
                      <img
                        src={productImagePreview}
                        alt="Product preview"
                      />
                      <button
                        type="button"
                        className="remove-upload-btn"
                        onClick={removeProductImage}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="upload-placeholder"
                      onClick={() => productImageInputRef.current?.click()}
                    >
                      <Upload size={25} />
                      <strong>Add Product Image</strong>
                      <span>JPG, PNG, WEBP or GIF · Max 5 MB</span>
                    </button>
                  )}
                  <input
                    ref={productImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={handleProductImage}
                  />
                  {productImagePreview && (
                    <button
                      type="button"
                      className="change-image-btn"
                      onClick={() => productImageInputRef.current?.click()}
                    >
                      <Upload size={15} />
                      Change Image
                    </button>
                  )}
                </div>
              </div>

              {/* BARCODE IMAGE UPLOAD */}
              <div className="upload-section">
                <label>Barcode Image 🏷️</label>
                <div className="barcode-upload-area">
                  {barcodeImagePreview ? (
                    <div className="barcode-image-preview">
                      <img
                        src={barcodeImagePreview}
                        alt="Barcode preview"
                      />
                      <button
                        type="button"
                        className="remove-upload-btn"
                        onClick={removeBarcodeImage}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="barcode-upload-placeholder"
                      onClick={() => barcodeImageInputRef.current?.click()}
                    >
                      <Barcode size={28} />
                      <strong>Add Barcode Image</strong>
                      <span>Small barcode image · Max 5 MB</span>
                    </button>
                  )}
                  <input
                    ref={barcodeImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={handleBarcodeImage}
                  />
                </div>
              </div>

              {/* PRODUCT INFORMATION FIELDS */}
              <div className="edit-section">
                <h3>Product Information</h3>
                <div className="edit-grid">
                  <div className="edit-field">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="ProductName"
                      value={editingProduct.ProductName}
                      onChange={handleEditChange}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="edit-field">
                    <label>For Whom / Gender *</label>
                    <select
                      name="ForWhom"
                      value={editingProduct.ForWhom}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>

                  <div className="edit-field">
                    <label>Price *</label>
                    <input
                      type="number"
                      name="Price"
                      min="0"
                      step="0.01"
                      value={editingProduct.Price}
                      onChange={handleEditChange}
                      placeholder="₹ 0.00"
                      required
                    />
                  </div>

                  <div className="edit-field">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      name="StockQuantity"
                      min="0"
                      value={editingProduct.StockQuantity}
                      onChange={handleEditChange}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="edit-field">
                    <label>Product Code</label>
                    <input
                      type="text"
                      value={
                        isAddMode
                          ? "Auto Generate"
                          : editingProduct.ProductCode || "Auto Generate"
                      }
                      disabled
                      readOnly
                    />
                    <small>Product code automatically generate hoga.</small>
                  </div>
                </div>
              </div>

              {/* FOOTER BUTTONS */}
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