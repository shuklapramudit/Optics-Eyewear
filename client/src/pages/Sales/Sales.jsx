import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ShoppingCart,
  Plus,
  FileText,
  Trash2,
  IndianRupee,
  Search,
  X,
  Loader2,
  Printer,
  Download,
  Save,
  Eye,
  History,
  UserRound,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from "lucide-react";

import "./Sales.css";


const API =
  "http://localhost:5000/api/sales";

const PRODUCTS_API =
  "http://localhost:5000/api/products";

const SERVER_URL =
  "http://localhost:5000";


/* =========================================================
   SHOP INFORMATION
   ========================================================= */

const SHOP_INFO = {
  name: "Chashma Plus",

  gstNumber:
    "P7WKV5D77N9FTLVQX3RCKUL3",

  address:
    "Arjunganj, Opposite side Shyam Misthan Vatika, Lucknow, U. P., 226002",
};


/* =========================================================
   SALES COMPONENT
   ========================================================= */

function Sales() {

  /* =======================================================
     BASIC DATA
     ======================================================= */

  const [customers, setCustomers] =
    useState([]);

  const [products, setProducts] =
    useState([]);


  /* =======================================================
     CUSTOMER
     ======================================================= */

  const [selectedCustomer, setSelectedCustomer] =
    useState("");

  const [customerMobile, setCustomerMobile] =
    useState("");


  /* =======================================================
     ITEMS
     ======================================================= */

  const [items, setItems] =
    useState([]);


  /* =======================================================
     PAYMENT
     ======================================================= */

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [paymentStatus, setPaymentStatus] =
    useState("Paid");

  const [paymentAmount, setPaymentAmount] =
    useState("");


  /* =======================================================
     PRODUCT MODAL
     ======================================================= */

  const [showProductModal, setShowProductModal] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState("");


  /* =======================================================
     GENERAL STATE
     ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  /* =======================================================
     INVOICE PREVIEW
     ======================================================= */

  const [showInvoicePreview, setShowInvoicePreview] =
    useState(false);

  const [invoicePreview, setInvoicePreview] =
    useState(null);

  /*
  ==========================================================
  PENDING INVOICE
  ==========================================================
  Generate Invoice creates only a preview.
  The payload is sent to the server only after Print or
  Save PDF is clicked.
  */
  const [pendingInvoicePayload, setPendingInvoicePayload] =
    useState(null);


  /* =======================================================
     INVOICE HISTORY
     ======================================================= */

  const [showInvoiceHistory, setShowInvoiceHistory] =
    useState(false);

  const [invoiceHistory, setInvoiceHistory] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");


  /* =======================================================
     LOAD CUSTOMERS + PRODUCTS
     ======================================================= */

  useEffect(() => {
    loadSalesData();
  }, []);


  const loadSalesData = async () => {

    try {

      setLoading(true);
      setError("");

      /*
       * Sales API supplies customers and the basic product list.
       * Products API supplies the authoritative product price and
       * the complete Images array. We merge both responses so the
       * Sales selector always shows the same data as Products page.
       */
      const [salesResponse, productsResponse] =
        await Promise.all([
          fetch(`${API}/form-data`),
          fetch(PRODUCTS_API),
        ]);

      const data =
        await salesResponse.json();

      if (
        !salesResponse.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to load sales data."
        );
      }

      let catalogProducts = [];

      try {
        const catalogData =
          await productsResponse.json();

        if (
          productsResponse.ok &&
          catalogData?.success
        ) {
          catalogProducts =
            Array.isArray(
              catalogData.products
            )
              ? catalogData.products
              : Array.isArray(
                  catalogData?.data?.products
                )
                ? catalogData.data.products
                : [];
        }
      } catch (catalogError) {
        console.warn(
          "Products catalog could not be loaded. Using Sales API data.",
          catalogError
        );
      }

      console.log(
        "SALES FORM DATA:",
        data
      );

      const formData =
        data?.data || {};

      const customerList =
        Array.isArray(
          formData.customers
        )
          ? formData.customers
          : Array.isArray(
              data?.customers
            )
            ? data.customers
            : [];

      const salesProducts =
        Array.isArray(
          formData.products
        )
          ? formData.products
          : Array.isArray(
              data?.products
            )
            ? data.products
            : [];

      /*
       * Merge by ProductID. Catalog data is applied last so Price,
       * ImageURL and Images come from /api/products.
       */
      const productList =
        salesProducts.map(
          (salesProduct) => {
            const catalogProduct =
              catalogProducts.find(
                (catalogItem) =>
                  String(
                    catalogItem.ProductID
                  ) ===
                  String(
                    salesProduct.ProductID
                  )
              );

            return {
              ...salesProduct,
              ...(catalogProduct || {}),
            };
          }
        );

      /* Also include products that exist in the catalog but were not
         returned by the Sales form-data endpoint. */
      const existingIds =
        new Set(
          productList.map(
            (product) =>
              String(product.ProductID)
          )
        );

      catalogProducts.forEach(
        (catalogProduct) => {
          const id = String(
            catalogProduct.ProductID
          );

          if (!existingIds.has(id)) {
            productList.push(
              catalogProduct
            );
          }
        }
      );

      setCustomers(
        customerList
      );

      setProducts(
        productList
      );

    } catch (err) {

      console.error(
        "Sales data error:",
        err
      );

      setError(
        err.message ||
        "Unable to load customers and products."
      );

    } finally {

      setLoading(false);

    }

  };


  /* =======================================================
     CUSTOMER CHANGE
     ======================================================= */

  const handleCustomerChange =
    (event) => {

      const customerId =
        event.target.value;

      setSelectedCustomer(
        customerId
      );


      const customer =
        customers.find(
          (item) =>
            String(
              item.CustomerID
            ) ===
            String(
              customerId
            )
        );


      if (customer) {

        setCustomerMobile(
          customer.MobileNumber ||
          customer.Mobile ||
          customer.Phone ||
          customer.PhoneNumber ||
          ""
        );

      } else {

        setCustomerMobile("");

      }

    };


  /* =======================================================
     CUSTOMER HELPERS
     ======================================================= */

  const getCustomerName =
    (customer) => {

      if (!customer) {
        return "Customer";
      }

      return (
        customer.FullName ||
        customer.CustomerName ||
        customer.Name ||
        `Customer #${customer.CustomerID || ""}`
      );

    };


  const getCustomerEmail =
    (customer) => {

      if (!customer) {
        return "";
      }

      return (
        customer.Email ||
        customer.email ||
        ""
      );

    };


  const getCustomerAddress =
    (customer) => {

      if (!customer) {
        return "";
      }

      const address =
        customer.Address ||
        customer.address ||
        "";

      const city =
        customer.City ||
        customer.city ||
        "";

      const state =
        customer.State ||
        customer.state ||
        "";

      return [
        address,
        city,
        state,
      ]
        .filter(Boolean)
        .join(", ");

    };


  /* =======================================================
     PRODUCT HELPERS
     ======================================================= */

  const getProductPrice =
    (product) => {

      /*
       * Price from Products API is the primary value.
       * Other names are only fallbacks for older API responses.
       * Zero is allowed, so a genuine 0 price is not replaced.
       */
      const possiblePrices = [
        product?.Price,
        product?.SellingPrice,
        product?.SalePrice,
        product?.UnitPrice,
        product?.LastPurchasePrice,
      ];

      for (const value of possiblePrices) {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          const number = Number(value);

          if (
            Number.isFinite(number) &&
            number >= 0
          ) {
            return number;
          }
        }
      }

      return 0;

    };


  /* =======================================================
     PRODUCT IMAGES
     ======================================================= */

  const normalizeProductImageUrl =
    (value) => {

      if (!value) {
        return "";
      }

      let url = String(value).trim();

      if (!url) {
        return "";
      }

      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }

      if (url.startsWith("//")) {
        return `http:${url}`;
      }

      if (url.startsWith("/uploads/")) {
        return `${SERVER_URL}${url}`;
      }

      if (url.startsWith("uploads/")) {
        return `${SERVER_URL}/${url}`;
      }

      if (url.startsWith("/")) {
        return `${SERVER_URL}${url}`;
      }

      return url;

    };


  const parseProductImageValue =
    (value) => {

      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();

        if (!trimmed) {
          return [];
        }

        try {
          const parsed = JSON.parse(trimmed);

          if (Array.isArray(parsed)) {
            return parsed;
          }

          if (typeof parsed === "string") {
            return [parsed];
          }
        } catch {
          return [trimmed];
        }
      }

      return [value];

    };


  const getProductImages =
    (product) => {

      if (!product) {
        return [];
      }

      const values = [
        ...parseProductImageValue(
          product.Images
        ),
        ...parseProductImageValue(
          product.ImageURL
        ),
        ...parseProductImageValue(
          product.imageURL
        ),
        ...parseProductImageValue(
          product.imageUrl
        ),
        ...parseProductImageValue(
          product.ProductImage
        ),
        ...parseProductImageValue(
          product.image
        ),
      ];

      const urls = values
        .map((image) => {
          if (typeof image === "string") {
            return normalizeProductImageUrl(
              image
            );
          }

          if (image && typeof image === "object") {
            return normalizeProductImageUrl(
              image.ImageURL ||
              image.imageURL ||
              image.imageUrl ||
              image.url ||
              image.URL
            );
          }

          return "";
        })
        .filter(Boolean);

      return [
        ...new Set(urls),
      ];

    };


  const getProductName =
    (product) => {

      return (
        product.ProductName ||
        product.Name ||
        "Unnamed Product"
      );

    };


  const getProductCode =
    (product) => {

      return (
        product.ProductCode ||
        product.SKU ||
        product.Barcode ||
        "-"
      );

    };


  /* =======================================================
     FILTER PRODUCTS
     ======================================================= */

  const filteredProducts =
    useMemo(() => {

      const search =
        productSearch
          .trim()
          .toLowerCase();


      if (!search) {
        return products;
      }


      return products.filter(
        (product) => {

          const name =
            getProductName(
              product
            ).toLowerCase();

          const code =
            getProductCode(
              product
            ).toLowerCase();


          return (
            name.includes(
              search
            ) ||
            code.includes(
              search
            )
          );

        }
      );

    }, [
      products,
      productSearch,
    ]);


  /* =======================================================
     ADD PRODUCT
     ======================================================= */

  const addProduct =
    (product) => {

      const productId =
        product.ProductID;


      const alreadyAdded =
        items.find(
          (item) =>
            String(
              item.productId
            ) ===
            String(
              productId
            )
        );


      if (alreadyAdded) {

        setItems(
          (currentItems) =>
            currentItems.map(
              (item) =>
                String(
                  item.productId
                ) ===
                String(
                  productId
                )
                  ? {
                      ...item,

                      quantity:
                        Number(
                          item.quantity
                        ) + 1,
                    }
                  : item
            )
        );

      } else {

        setItems(
          (currentItems) => [

            ...currentItems,

            {
              id:
                `${productId}-${Date.now()}`,

              productId:
                product.ProductID,

              product:
                getProductName(
                  product
                ),

              sku:
                getProductCode(
                  product
                ),

              quantity: 1,

              price:
                getProductPrice(
                  product
                ),

              applyGST: false,

              gstRate: 0,
            },

          ]
        );

      }


      setShowProductModal(
        false
      );

      setProductSearch("");

    };


  /* =======================================================
     REMOVE PRODUCT
     ======================================================= */

  const removeItem =
    (id) => {

      setItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              item.id !== id
          )
      );

    };


  /* =======================================================
     UPDATE QUANTITY
     ======================================================= */

  const updateQuantity =
    (
      id,
      quantity
    ) => {

      const value =
        Math.max(
          1,
          Number(quantity) || 1
        );


      setItems(
        (currentItems) =>
          currentItems.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    quantity:
                      value,
                  }
                : item
          )
      );

    };


  /* =======================================================
     GST TOGGLE
     ======================================================= */

  const toggleGST =
    (id) => {

      setItems(
        (currentItems) =>
          currentItems.map(
            (item) => {

              if (
                item.id !== id
              ) {
                return item;
              }


              const enabled =
                !item.applyGST;


              return {

                ...item,

                applyGST:
                  enabled,

                gstRate:
                  enabled
                    ? 18
                    : 0,

              };

            }
          )
      );

    };


  /* =======================================================
     GST RATE
     ======================================================= */

  const updateGSTRate =
    (
      id,
      rate
    ) => {

      const value =
        Math.max(
          0,
          Number(rate) || 0
        );


      setItems(
        (currentItems) =>
          currentItems.map(
            (item) =>
              item.id === id
                ? {

                    ...item,

                    gstRate:
                      value,

                    applyGST:
                      value > 0,

                  }
                : item
          )
      );

    };


  /* =======================================================
     CALCULATIONS
     ======================================================= */

  const calculatedItems =
    useMemo(() => {

      return items.map(
        (item) => {

          const taxableAmount =
            Number(item.price) *
            Number(item.quantity);


          const gstAmount =
            item.applyGST
              ? (
                  taxableAmount *
                  Number(
                    item.gstRate
                  )
                ) / 100
              : 0;


          const totalAmount =
            taxableAmount +
            gstAmount;


          return {

            ...item,

            taxableAmount,

            gstAmount,

            totalAmount,

          };

        }
      );

    }, [items]);


  const subtotal =
    calculatedItems.reduce(
      (
        totalValue,
        item
      ) =>
        totalValue +
        item.taxableAmount,
      0
    );


  const gst =
    calculatedItems.reduce(
      (
        totalValue,
        item
      ) =>
        totalValue +
        item.gstAmount,
      0
    );


  const total =
    subtotal + gst;


  /* =======================================================
     PAYMENT CALCULATION
     ======================================================= */

  const finalPaymentAmount =
    useMemo(() => {

      if (
        paymentStatus ===
        "Paid"
      ) {
        return total;
      }


      if (
        paymentStatus ===
        "Pending"
      ) {
        return 0;
      }


      return Math.min(
        Math.max(
          Number(
            paymentAmount
          ) || 0,
          0
        ),
        total
      );

    }, [
      paymentStatus,
      paymentAmount,
      total,
    ]);


  const balanceAmount =
    Math.max(
      total -
        finalPaymentAmount,
      0
    );


  /* =======================================================
     FORMAT CURRENCY
     ======================================================= */

  const money =
    (value) =>
      Number(
        value || 0
      ).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );


  /* =======================================================
     FORMAT DATE
     ======================================================= */

  const formatDate =
    (value) => {

      if (!value) {
        return "-";
      }


      const date =
        value instanceof Date
          ? value
          : new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
      }


      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    };


  /* =======================================================
     GENERATE INVOICE PREVIEW
     ======================================================= */

  const generateInvoice =
    () => {

      setMessage("");
      setError("");

      if (!selectedCustomer) {
        setError(
          "Please select a customer."
        );
        return;
      }

      if (items.length === 0) {
        setError(
          "Please add at least one product."
        );
        return;
      }

      if (total <= 0) {
        setError(
          "Invoice total must be greater than zero."
        );
        return;
      }

      const selectedCustomerData =
        customers.find(
          (customer) =>
            String(customer.CustomerID) ===
            String(selectedCustomer)
        );

      /*
      ========================================================
      PREPARE PAYLOAD ONLY
      ========================================================
      Nothing is sent to MySQL here.
      */
      const payload = {
        customerId:
          Number(selectedCustomer),

        items:
          calculatedItems.map(
            (item) => ({
              productId:
                Number(item.productId),

              quantity:
                Number(item.quantity),

              unitPrice:
                Number(item.price),

              taxableAmount:
                Number(item.taxableAmount),

              applyGST:
                Boolean(item.applyGST),

              gstRate:
                Number(item.gstRate),

              gstAmount:
                Number(item.gstAmount),

              totalAmount:
                Number(item.totalAmount),
            })
          ),

        paymentMethod,
        paymentStatus,

        subtotal:
          Number(subtotal),

        totalGST:
          Number(gst),

        grandTotal:
          Number(total),

        advanceAmount:
          Number(finalPaymentAmount),

        balanceAmount:
          Number(balanceAmount),
      };

      /*
      ========================================================
      PREVIEW DATA
      ========================================================
      A temporary number is shown until the server creates the
      real invoice number after Print / Save PDF is clicked.
      */
      const previewInvoice = {
        invoiceId: null,
        saleId: null,

        invoiceNumber:
          `PREVIEW-${Date.now()}`,

        invoiceDate:
          new Date(),

        shopName:
          SHOP_INFO.name,

        shopGST:
          SHOP_INFO.gstNumber,

        shopAddress:
          SHOP_INFO.address,

        customerName:
          selectedCustomerData?.FullName ||
          selectedCustomerData?.CustomerName ||
          selectedCustomerData?.Name ||
          `Customer #${selectedCustomer}`,

        customerPhone:
          customerMobile,

        customerEmail:
          selectedCustomerData?.Email ||
          "",

        customerAddress:
          getCustomerAddress(
            selectedCustomerData
          ),

        customerCity:
          selectedCustomerData?.City ||
          "",

        customerState:
          selectedCustomerData?.State ||
          "Uttar Pradesh",

        items:
          calculatedItems.map(
            (item) => ({
              product:
                item.product,

              sku:
                item.sku,

              quantity:
                Number(item.quantity),

              price:
                Number(item.price),

              gstRate:
                Number(item.gstRate),

              gstAmount:
                Number(item.gstAmount),

              taxableAmount:
                Number(item.taxableAmount),

              totalAmount:
                Number(item.totalAmount),

              applyGST:
                Boolean(item.applyGST),
            })
          ),

        subtotal:
          Number(subtotal),

        gst:
          Number(gst),

        total:
          Number(total),

        advance:
          Number(finalPaymentAmount),

        balance:
          Number(balanceAmount),

        paymentMethod,
        paymentStatus,
      };

      setPendingInvoicePayload(
        payload
      );

      setInvoicePreview(
        previewInvoice
      );

      setShowInvoicePreview(
        true
      );

      setMessage(
        "Invoice preview ready. Nothing is saved yet. Click Save Invoice or Print to save it."
      );

      /*
      The preview has its own copy of all invoice data, so the
      entry form can safely be cleared.
      */
      setItems([]);
      setSelectedCustomer("");
      setCustomerMobile("");
      setPaymentMethod("Cash");
      setPaymentStatus("Paid");
      setPaymentAmount("");
    };


  /* =======================================================
     SAVE INVOICE + PRINT / PDF
     ======================================================= */

  const finalizeInvoice =
    async (
      action
    ) => {

      if (
        !invoicePreview ||
        !pendingInvoicePayload ||
        saving
      ) {
        return;
      }

      try {

        setSaving(true);
        setError("");
        setMessage("");

        const response =
          await fetch(
            `${API}/create-invoice`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  pendingInvoicePayload
                ),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
            "Unable to save invoice."
          );
        }

        const generatedInvoiceNumber =
          data?.data?.invoiceNumber ||
          data?.data?.InvoiceNumber ||
          data?.invoiceNumber ||
          data?.InvoiceNumber ||
          invoicePreview.invoiceNumber;

        const generatedInvoiceId =
          data?.data?.invoiceId ||
          data?.data?.InvoiceID ||
          data?.invoiceId ||
          data?.InvoiceID ||
          null;

        const generatedSaleId =
          data?.data?.saleId ||
          data?.data?.SaleID ||
          data?.saleId ||
          data?.SaleID ||
          null;

        /*
        Update the preview with the real invoice number returned
        by the server before opening the print dialog.
        */
        setInvoicePreview(
          (current) =>
            current
              ? {
                  ...current,
                  invoiceNumber:
                    generatedInvoiceNumber,
                  invoiceId:
                    generatedInvoiceId,
                  saleId:
                    generatedSaleId,
                }
              : current
        );

        setPendingInvoicePayload(null);

        setMessage(
          action === "print"
            ? `${generatedInvoiceNumber} saved successfully. Opening print dialog...`
            : action === "pdf"
              ? `${generatedInvoiceNumber} saved successfully. Opening PDF print dialog...`
              : `${generatedInvoiceNumber} saved successfully.`
        );

        /*
        Wait for React to render the real invoice number.
        */
        await new Promise(
          (resolve) =>
            requestAnimationFrame(
              () =>
                requestAnimationFrame(
                  resolve
                )
            )
        );

        if (
          action === "print" ||
          action === "pdf"
        ) {
          window.print();
        }

      } catch (err) {

        console.error(
          "Finalize invoice error:",
          err
        );

        setError(
          err.message ||
          "Unable to save invoice."
        );

      } finally {

        setSaving(false);

      }
    };


  /* =======================================================
     LOAD INVOICE HISTORY
     ======================================================= */

  const loadInvoiceHistory =
    async () => {

      try {

        setHistoryLoading(
          true
        );

        setHistoryError("");


        const response =
          await fetch(
            `${API}/invoices`
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            "Unable to load invoice history."
          );

        }


        const list =
          data?.data
            ?.invoices ||
          data?.data ||
          data?.invoices ||
          [];


        setInvoiceHistory(
          Array.isArray(list)
            ? list
            : []
        );


        setShowInvoiceHistory(
          true
        );


      } catch (err) {

        console.error(
          "Invoice history error:",
          err
        );

        setHistoryError(
          err.message ||
          "Unable to load invoice history."
        );

        setShowInvoiceHistory(
          true
        );

      } finally {

        setHistoryLoading(
          false
        );

      }

    };


  /* =======================================================
     VIEW INVOICE FROM HISTORY
     ======================================================= */

  const openHistoryInvoice =
    (invoice) => {
      if (!invoice) {
        return;
      }

      const historyItems =
        invoice.items ||
        invoice.Items ||
        invoice.invoiceItems ||
        invoice.InvoiceItems ||
        [];

      const normalizedItems =
        Array.isArray(historyItems)
          ? historyItems.map((item) => {
              const quantity =
                Number(
                  item.quantity ??
                  item.Quantity ??
                  item.Qty ??
                  1
                ) || 1;

              const price =
                Number(
                  item.price ??
                  item.Price ??
                  item.UnitPrice ??
                  item.unitPrice ??
                  0
                ) || 0;

              const gstRate =
                Number(
                  item.gstRate ??
                  item.GSTRate ??
                  item.GST ??
                  0
                ) || 0;

              const gstAmount =
                Number(
                  item.gstAmount ??
                  item.GSTAmount ??
                  0
                ) || 0;

              const totalAmount =
                Number(
                  item.totalAmount ??
                  item.TotalAmount ??
                  item.Total ??
                  quantity * price + gstAmount
                ) || 0;

              return {
                product:
                  item.product ||
                  item.ProductName ||
                  item.productName ||
                  item.Name ||
                  "Product",
                sku:
                  item.sku ||
                  item.SKU ||
                  item.ProductCode ||
                  "-",
                quantity,
                price,
                gstRate,
                gstAmount,
                taxableAmount:
                  Number(
                    item.taxableAmount ??
                    item.TaxableAmount ??
                    quantity * price
                  ) || 0,
                totalAmount,
                applyGST:
                  Boolean(
                    item.applyGST ??
                    item.ApplyGST ??
                    gstRate > 0
                  ),
              };
            })
          : [];

      const historyTotal =
        Number(
          invoice.GrandTotal ??
          invoice.grandTotal ??
          invoice.Total ??
          invoice.total ??
          0
        ) || 0;

      const historySubtotal =
        Number(
          invoice.TotalTaxableAmount ??
          invoice.totalTaxableAmount ??
          invoice.SubTotal ??
          invoice.subtotal ??
          normalizedItems.reduce(
            (sum, item) =>
              sum + Number(item.taxableAmount || 0),
            0
          )
        ) || 0;

      const historyGST =
        Number(
          invoice.TotalGST ??
          invoice.totalGST ??
          invoice.GSTAmount ??
          invoice.gst ??
          normalizedItems.reduce(
            (sum, item) =>
              sum + Number(item.gstAmount || 0),
            0
          )
        ) || 0;

      const advance =
        Number(
          invoice.AdvanceAmount ??
          invoice.advanceAmount ??
          invoice.Advance ??
          invoice.advance ??
          0
        ) || 0;

      const balance =
        Number(
          invoice.BalanceAmount ??
          invoice.balanceAmount ??
          invoice.Balance ??
          invoice.balance ??
          Math.max(historyTotal - advance, 0)
        ) || 0;

      const customerName =
        invoice.CustomerName ||
        invoice.FullName ||
        invoice.customerName ||
        invoice.Name ||
        "Customer";

      const historyPreview = {
        invoiceId:
          invoice.InvoiceID ??
          invoice.invoiceId ??
          null,
        saleId:
          invoice.SaleID ??
          invoice.saleId ??
          null,
        invoiceNumber:
          invoice.InvoiceNumber ||
          invoice.invoiceNumber ||
          "Invoice",
        invoiceDate:
          invoice.InvoiceDate ||
          invoice.invoiceDate ||
          invoice.CreatedAt ||
          invoice.createdAt ||
          new Date(),
        shopName:
          invoice.CompanyName ||
          invoice.companyName ||
          SHOP_INFO.name,
        shopGST:
          invoice.CompanyGSTNumber ||
          invoice.companyGSTNumber ||
          SHOP_INFO.gstNumber,
        shopAddress:
          invoice.CompanyAddress ||
          invoice.companyAddress ||
          SHOP_INFO.address,
        customerName,
        customerPhone:
          invoice.MobileNumber ||
          invoice.Mobile ||
          invoice.Phone ||
          invoice.customerPhone ||
          "",
        customerEmail:
          invoice.Email ||
          invoice.email ||
          invoice.customerEmail ||
          "",
        customerAddress:
          invoice.BillingAddress ||
          invoice.billingAddress ||
          invoice.CustomerAddress ||
          invoice.customerAddress ||
          "",
        customerCity:
          invoice.City ||
          invoice.city ||
          invoice.customerCity ||
          "",
        customerState:
          invoice.PlaceOfSupply ||
          invoice.State ||
          invoice.state ||
          invoice.customerState ||
          "Uttar Pradesh",
        items: normalizedItems,
        subtotal: historySubtotal,
        gst: historyGST,
        total: historyTotal,
        advance,
        balance,
        paymentMethod:
          invoice.PaymentMode ||
          invoice.paymentMode ||
          invoice.PaymentMethod ||
          invoice.paymentMethod ||
          "Cash",
        paymentStatus:
          invoice.PaymentStatus ||
          invoice.paymentStatus ||
          "Paid",
      };

      setShowInvoiceHistory(false);
      setPendingInvoicePayload(null);
      setInvoicePreview(historyPreview);
      setShowInvoicePreview(true);
    };


  /* =======================================================
     CLOSE PREVIEW
     ======================================================= */

  const closeInvoicePreview =
    () => {

      setShowInvoicePreview(
        false
      );

      setInvoicePreview(
        null
      );

      /*
      Closing without Print / Save PDF means the pending
      invoice is discarded and nothing is committed.
      */
      setPendingInvoicePayload(
        null
      );
    };


  /* =======================================================
     SAVE INVOICE
     ======================================================= */

  const saveInvoice = () => {

    if (
      !invoicePreview ||
      !pendingInvoicePayload ||
      saving
    ) {
      return;
    }

    finalizeInvoice("save");
  };


  /* =======================================================
     PRINT
     ======================================================= */

  const printInvoice =
    () => {

      if (
        !invoicePreview ||
        !pendingInvoicePayload ||
        saving
      ) {
        return;
      }

      finalizeInvoice(
        "print"
      );
    };


  /* =======================================================
     SAVE PDF
     ======================================================= */

  const downloadInvoice =
    () => {

      if (
        !invoicePreview ||
        !pendingInvoicePayload ||
        saving
      ) {
        return;
      }

      /*
      Opens the browser Print dialog. Select "Save as PDF"
      there. The invoice is committed when this button is
      clicked.
      */
      finalizeInvoice(
        "pdf"
      );
    };


  /* =======================================================
     ESC KEY
     ======================================================= */

  useEffect(() => {

    const handleKeyDown =
      (event) => {

        if (
          event.key ===
            "Escape" &&
          showInvoicePreview
        ) {

          closeInvoicePreview();

        }

      };


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [
    showInvoicePreview,
  ]);


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="sales-page">


      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="page-top">

        <div>

          <h1>
            Sales & Billing
          </h1>

          <p>
            Create customer bills
            and GST invoices.
          </p>

        </div>


        <button
          className="primary-btn"
          type="button"
          onClick={
            loadInvoiceHistory
          }
        >

          <History size={17} />

          Invoice History

        </button>

      </div>


      {/* ===================================================
          ALERTS
          =================================================== */}

      {error && (

        <div className="sales-alert error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>

        </div>

      )}


      {message && (

        <div className="sales-alert success">

          <span>
            {message}
          </span>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
          >
            <X size={15} />
          </button>

        </div>

      )}


      {/* ===================================================
          LOADING
          =================================================== */}

      {loading ? (

        <div className="sales-loading">

          <Loader2
            size={28}
            className="spin"
          />

          <span>
            Loading customers
            and products...
          </span>

        </div>

      ) : (

        <div className="billing-layout">


          {/* =================================================
              MAIN
              ================================================= */}

          <div className="billing-main">


            {/* ===============================================
                CUSTOMER
                =============================================== */}

            <div className="billing-card">

              <div className="billing-card-header">

                <div>

                  <h2>
                    Customer Details
                  </h2>

                  <span>
                    Select customer
                    for this sale
                  </span>

                </div>


                <button
                  className="small-btn"
                  type="button"
                  onClick={() =>
                    alert(
                      "Please add the customer from Customers page."
                    )
                  }
                >

                  <Plus size={15} />

                  New Customer

                </button>

              </div>


              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Customer
                  </label>


                  <select
                    value={
                      selectedCustomer
                    }
                    onChange={
                      handleCustomerChange
                    }
                  >

                    <option value="">
                      Select Customer
                    </option>


                    {customers.map(
                      (customer) => (

                        <option
                          key={
                            customer.CustomerID
                          }
                          value={
                            customer.CustomerID
                          }
                        >

                          {getCustomerName(
                            customer
                          )}

                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Mobile Number
                  </label>


                  <input
                    type="text"
                    placeholder="Customer mobile"
                    value={
                      customerMobile
                    }
                    onChange={(event) =>
                      setCustomerMobile(
                        event.target.value
                      )
                    }
                  />

                </div>


              </div>

            </div>


            {/* ===============================================
                PRODUCTS
                =============================================== */}

            <div className="billing-card">

              <div className="billing-card-header">

                <div>

                  <h2>
                    Products
                  </h2>

                  <span>
                    Add products to invoice
                  </span>

                </div>


                <button
                  className="small-btn"
                  type="button"
                  onClick={() =>
                    setShowProductModal(
                      true
                    )
                  }
                >

                  <Plus size={15} />

                  Add Product

                </button>

              </div>


              {items.length === 0 ? (

                <div className="empty-items">

                  <ShoppingCart
                    size={30}
                  />

                  <strong>
                    No products added
                  </strong>

                  <span>
                    Click Add Product
                    to add items to
                    this invoice.
                  </span>

                </div>

              ) : (

                <div className="invoice-items">

                  {calculatedItems.map(
                    (item) => (

                      <div
                        className="invoice-item"
                        key={item.id}
                      >


                        <div className="invoice-product">

                          <div className="product-icon">

                            <ShoppingCart
                              size={18}
                            />

                          </div>


                          <div>

                            <strong>
                              {item.product}
                            </strong>

                            <span>
                              SKU: {item.sku}
                            </span>

                          </div>

                        </div>


                        <div className="quantity-control">

                          <label>
                            Qty
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              item.quantity
                            }
                            onChange={(event) =>
                              updateQuantity(
                                item.id,
                                event.target.value
                              )
                            }
                          />

                        </div>


                        <div className="item-price">

                          <span>
                            Price
                          </span>

                          <strong>
                            ₹
                            {money(
                              item.price
                            )}
                          </strong>

                        </div>


                        <div className="item-gst">

                          <label className="gst-toggle">

                            <input
                              type="checkbox"
                              checked={
                                item.applyGST
                              }
                              onChange={() =>
                                toggleGST(
                                  item.id
                                )
                              }
                            />

                            <span>
                              GST
                            </span>

                          </label>


                          {item.applyGST && (

                            <input
                              className="gst-rate-input"
                              type="number"
                              min="0"
                              max="100"
                              value={
                                item.gstRate
                              }
                              onChange={(event) =>
                                updateGSTRate(
                                  item.id,
                                  event.target.value
                                )
                              }
                            />

                          )}

                        </div>


                        <div className="item-total">

                          <span>
                            Total
                          </span>

                          <strong>
                            ₹
                            {money(
                              item.totalAmount
                            )}
                          </strong>

                        </div>


                        <button
                          className="delete-item"
                          type="button"
                          onClick={() =>
                            removeItem(
                              item.id
                            )
                          }
                        >

                          <Trash2
                            size={16}
                          />

                        </button>


                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            {/* ===============================================
                PAYMENT
                =============================================== */}

            <div className="billing-card">

              <div className="billing-card-header">

                <div>

                  <h2>
                    Payment
                  </h2>

                  <span>
                    Payment information
                  </span>

                </div>

              </div>


              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Payment Method
                  </label>


                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value
                      )
                    }
                  >

                    <option>
                      Cash
                    </option>

                    <option>
                      UPI
                    </option>

                    <option>
                      Card
                    </option>

                    <option>
                      Credit
                    </option>

                    <option>
                      Bank Transfer
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Payment Status
                  </label>


                  <select
                    value={
                      paymentStatus
                    }
                    onChange={(event) =>
                      setPaymentStatus(
                        event.target.value
                      )
                    }
                  >

                    <option value="Paid">
                      Paid
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Partial">
                      Partial
                    </option>

                  </select>

                </div>


              </div>


              {paymentStatus ===
                "Partial" && (

                <div className="partial-payment">

                  <label>
                    Advance Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={total}
                    value={
                      paymentAmount
                    }
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter advance amount"
                  />

                </div>

              )}

            </div>


          </div>


          {/* =================================================
              SUMMARY
              ================================================= */}

          <div className="invoice-summary">


            <div className="summary-header">

              <FileText size={19} />

              <div>

                <h2>
                  Invoice Summary
                </h2>

                <span>
                  New Invoice
                </span>

              </div>

            </div>


            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {money(
                  subtotal
                )}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                GST
              </span>

              <strong>
                ₹
                {money(gst)}
              </strong>

            </div>


            <div className="summary-divider" />


            <div className="summary-row">

              <span>
                Advance
              </span>

              <strong>
                ₹
                {money(
                  finalPaymentAmount
                )}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Balance
              </span>

              <strong
                className={
                  balanceAmount > 0
                    ? "balance-danger"
                    : "balance-success"
                }
              >
                ₹
                {money(
                  balanceAmount
                )}
              </strong>

            </div>


            <div className="summary-divider" />


            <div className="grand-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {money(total)}
              </strong>

            </div>


            <button
              className="generate-invoice"
              type="button"
              disabled={
                saving ||
                items.length === 0 ||
                !selectedCustomer
              }
              onClick={
                generateInvoice
              }
            >

              {saving ? (

                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />

                  Saving...
                </>

              ) : (

                <>
                  <Eye
                    size={17}
                  />

                  Preview Invoice
                </>

              )}

            </button>


          </div>


        </div>

      )}


      {/* =====================================================
          PRODUCT MODAL
          ===================================================== */}

      {showProductModal && (

        <div
          className="product-modal-overlay"
          onClick={() =>
            setShowProductModal(
              false
            )
          }
        >

          <div
            className="product-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            <div className="product-modal-header">

              <div>

                <h2>
                  Add Product
                </h2>

                <span>
                  Select a product
                  for this invoice
                </span>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowProductModal(
                    false
                  )
                }
              >
                <X size={19} />
              </button>

            </div>


            <div className="product-search">

              <Search size={17} />

              <input
                type="text"
                placeholder="Search product or SKU..."
                value={
                  productSearch
                }
                onChange={(event) =>
                  setProductSearch(
                    event.target.value
                  )
                }
                autoFocus
              />

            </div>


            <div className="product-list">

              {filteredProducts.length ===
              0 ? (

                <div className="empty-products">
                  No products found.
                </div>

              ) : (

                filteredProducts.map(
                  (product) => (

                    <button
                      className="product-select-item"
                      type="button"
                      key={
                        product.ProductID
                      }
                      onClick={() =>
                        addProduct(
                          product
                        )
                      }
                    >

                      <div
                        className="product-select-icon"
                        style={{
                          width: "48px",
                          height: "48px",
                          minWidth: "48px",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "10px",
                          background: "#eef4ff",
                        }}
                      >

                        {getProductImages(product).length > 0 ? (
                          <img
                            src={
                              getProductImages(product)[0]
                            }
                            alt={
                              getProductName(product)
                            }
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ShoppingCart
                            size={18}
                          />
                        )}

                      </div>


                      <div className="product-select-info">

                        <strong>
                          {getProductName(
                            product
                          )}
                        </strong>

                        <span>
                          SKU:{" "}
                          {getProductCode(
                            product
                          )}
                        </span>

                      </div>


                      <strong className="product-select-price">

                        ₹
                        {money(
                          getProductPrice(
                            product
                          )
                        )}

                      </strong>


                    </button>

                  )
                )

              )}

            </div>


          </div>

        </div>

      )}


      {/* =====================================================
          PROFESSIONAL INVOICE PREVIEW
          ===================================================== */}

      {showInvoicePreview &&
        invoicePreview && (

        <div
          className="invoice-preview-overlay"
          onClick={
            closeInvoicePreview
          }
        >

          <div
            className="invoice-preview-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* ===============================================
                TOOLBAR
                =============================================== */}

            <div className="invoice-preview-toolbar">

              <div className="invoice-preview-title">

                <div className="invoice-preview-title-icon">

                  <FileText size={18} />

                </div>


                <div>

                  <h2>
                    Invoice Preview
                  </h2>

                  <span>
                    {
                      invoicePreview.invoiceNumber
                    }
                    {pendingInvoicePayload && (
                      " • Preview only"
                    )}
                  </span>

                </div>

              </div>


              <div className="invoice-preview-toolbar-actions">

                <button
                  type="button"
                  className="invoice-toolbar-btn invoice-save-btn"
                  onClick={
                    saveInvoice
                  }
                  disabled={
                    saving ||
                    !pendingInvoicePayload
                  }
                >

                  {saving ? (
                    <Loader2
                      size={16}
                      className="spin"
                    />
                  ) : (
                    <Save size={16} />
                  )}

                  <span>
                    {saving ? "Saving..." : "Save Invoice"}
                  </span>

                </button>


                <button
                  type="button"
                  className="invoice-toolbar-btn invoice-print-btn"
                  onClick={
                    printInvoice
                  }
                  disabled={
                    saving ||
                    !pendingInvoicePayload
                  }
                >

                  <Printer size={16} />

                  <span>
                    Print
                  </span>

                </button>


                <button
                  type="button"
                  className="invoice-toolbar-btn invoice-pdf-btn"
                  onClick={
                    downloadInvoice
                  }
                  disabled={
                    saving ||
                    !pendingInvoicePayload
                  }
                >

                  <Download size={16} />

                  <span>
                    Save PDF
                  </span>

                </button>


                <button
                  type="button"
                  className="invoice-close-btn"
                  onClick={
                    closeInvoicePreview
                  }
                >

                  <X size={19} />

                </button>

              </div>

            </div>


            {/* ===============================================
                INVOICE DOCUMENT
                =============================================== */}

            <div
              className="invoice-document"
              id="invoice-print-area"
            >


              {/* =============================================
                  HEADER
                  ============================================= */}

              <div className="invoice-document-header">


                <div className="invoice-company">

                  <div className="invoice-company-logo">
                    CP
                  </div>


                  <div>

                    <h1>
                      {
                        invoicePreview.shopName
                      }
                    </h1>

                    <p>
                      {
                        invoicePreview.shopAddress
                      }
                    </p>


                    <div className="invoice-gstin">

                      <span>
                        GSTIN
                      </span>

                      <strong>
                        {
                          invoicePreview.shopGST
                        }
                      </strong>

                    </div>

                  </div>

                </div>


                <div className="invoice-heading">

                  <div className="invoice-type">
                    TAX INVOICE
                  </div>


                  <div className="invoice-number-box">

                    <span>
                      Invoice Number
                    </span>

                    <strong>
                      {
                        invoicePreview.invoiceNumber
                      }
                    </strong>

                  </div>


                  <div className="invoice-date-box">

                    <span>
                      Invoice Date
                    </span>

                    <strong>
                      {
                        formatDate(
                          invoicePreview.invoiceDate
                        )
                      }
                    </strong>

                  </div>

                </div>


              </div>


              <div className="invoice-blue-divider" />


              {/* =============================================
                  CUSTOMER + PAYMENT
                  ============================================= */}

              <div className="invoice-info-grid">


                {/* CUSTOMER */}

                <div className="invoice-info-card">

                  <div className="invoice-info-card-header">

                    <div className="invoice-info-icon">

                      <UserRound
                        size={17}
                      />

                    </div>


                    <div>

                      <span>
                        BILL TO
                      </span>

                      <strong>
                        Customer Details
                      </strong>

                    </div>

                  </div>


                  <div className="invoice-customer-name">

                    {
                      invoicePreview.customerName
                    }

                  </div>


                  <div className="invoice-contact-row">

                    <Phone size={13} />

                    <span>
                      {
                        invoicePreview.customerPhone ||
                        "-"
                      }
                    </span>

                  </div>


                  {invoicePreview.customerEmail && (

                    <div className="invoice-contact-row">

                      <Mail size={13} />

                      <span>
                        {
                          invoicePreview.customerEmail
                        }
                      </span>

                    </div>

                  )}


                  {invoicePreview.customerAddress && (

                    <div className="invoice-contact-row">

                      <MapPin size={13} />

                      <span>
                        {
                          invoicePreview.customerAddress
                        }
                      </span>

                    </div>

                  )}

                </div>


                {/* PAYMENT */}

                <div className="invoice-info-card">

                  <div className="invoice-info-card-header">

                    <div className="invoice-info-icon payment">

                      <IndianRupee
                        size={17}
                      />

                    </div>


                    <div>

                      <span>
                        PAYMENT
                      </span>

                      <strong>
                        Payment Details
                      </strong>

                    </div>

                  </div>


                  <div className="invoice-payment-row">

                    <span>
                      Payment Method
                    </span>

                    <strong>
                      {
                        invoicePreview.paymentMethod
                      }
                    </strong>

                  </div>


                  <div className="invoice-payment-row">

                    <span>
                      Payment Status
                    </span>

                    <span
                      className={`invoice-status-badge ${String(
                        invoicePreview.paymentStatus
                      ).toLowerCase()}`}
                    >

                      <CheckCircle2
                        size={11}
                      />

                      {
                        invoicePreview.paymentStatus
                      }

                    </span>

                  </div>


                  <div className="invoice-payment-row">

                    <span>
                      Place of Supply
                    </span>

                    <strong>
                      {
                        invoicePreview.customerState ||
                        "Uttar Pradesh"
                      }
                    </strong>

                  </div>


                </div>


              </div>


              {/* =============================================
                  ITEMS
                  ============================================= */}

              <div className="invoice-items-section">


                <div className="invoice-section-title">

                  <div>

                    <span>
                      INVOICE ITEMS
                    </span>

                    <strong>
                      Products & Services
                    </strong>

                  </div>


                  <div className="invoice-item-count">

                    {
                      invoicePreview.items.length
                    }

                    {" "}

                    {
                      invoicePreview.items.length ===
                      1
                        ? "Item"
                        : "Items"
                    }

                  </div>

                </div>


                <div className="invoice-table-wrapper">

                  <table className="professional-invoice-table">

                    <thead>

                      <tr>

                        <th>
                          #
                        </th>

                        <th>
                          PRODUCT
                        </th>

                        <th>
                          SKU
                        </th>

                        <th>
                          QTY
                        </th>

                        <th>
                          UNIT PRICE
                        </th>

                        <th>
                          GST
                        </th>

                        <th>
                          GST AMOUNT
                        </th>

                        <th>
                          TOTAL
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {invoicePreview.items.map(
                        (
                          item,
                          index
                        ) => (

                          <tr
                            key={`${item.sku}-${index}`}
                          >

                            <td className="item-number">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </td>


                            <td className="item-product">

                              <strong>
                                {
                                  item.product
                                }
                              </strong>

                            </td>


                            <td className="item-sku">

                              {
                                item.sku
                              }

                            </td>


                            <td className="item-qty">

                              {
                                item.quantity
                              }

                            </td>


                            <td className="item-price-cell">

                              ₹
                              {money(
                                item.price
                              )}

                            </td>


                            <td className="item-gst-cell">

                              {item.applyGST ? (

                                <strong>
                                  {
                                    item.gstRate
                                  }
                                  %
                                </strong>

                              ) : (

                                <span>
                                  No GST
                                </span>

                              )}

                            </td>


                            <td className="item-gst-amount-cell">

                              ₹
                              {money(
                                item.gstAmount
                              )}

                            </td>


                            <td className="item-total-cell">

                              ₹
                              {money(
                                item.totalAmount
                              )}

                            </td>


                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>


              </div>


              {/* =============================================
                  TOTALS
                  ============================================= */}

              <div className="invoice-bottom-section">


                <div className="invoice-note">

                  <div className="invoice-note-icon">

                    <CheckCircle2
                      size={16}
                    />

                  </div>


                  <div>

                    <strong>
                      Thank you for your business
                    </strong>

                    <p>
                      This is a
                      computer-generated
                      invoice and does
                      not require a
                      signature.
                    </p>

                  </div>

                </div>


                <div className="invoice-total-box">


                  <div className="invoice-total-row">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      ₹
                      {money(
                        invoicePreview.subtotal
                      )}
                    </strong>

                  </div>


                  <div className="invoice-total-row">

                    <span>
                      GST
                    </span>

                    <strong>
                      ₹
                      {money(
                        invoicePreview.gst
                      )}
                    </strong>

                  </div>


                  <div className="invoice-total-line" />


                  <div className="invoice-total-row">

                    <span>
                      Advance Paid
                    </span>

                    <strong className="advance-value">

                      ₹
                      {money(
                        invoicePreview.advance
                      )}

                    </strong>

                  </div>


                  <div className="invoice-total-row">

                    <span>
                      Balance Due
                    </span>

                    <strong
                      className={
                        invoicePreview.balance >
                        0
                          ? "balance-due"
                          : "balance-paid"
                      }
                    >

                      ₹
                      {money(
                        invoicePreview.balance
                      )}

                    </strong>

                  </div>


                  <div className="invoice-grand-total">

                    <div>

                      <span>
                        Grand Total
                      </span>

                      <small>
                        Inclusive of applicable taxes
                      </small>

                    </div>


                    <strong>

                      ₹
                      {money(
                        invoicePreview.total
                      )}

                    </strong>

                  </div>


                </div>


              </div>


              {/* =============================================
                  FOOTER
                  ============================================= */}

              <div className="invoice-document-footer">

                <div>

                  <strong>
                    Chashma Plus
                  </strong>

                  <span>
                    Professional Eyewear
                    & Optical Solutions
                  </span>

                </div>


                <div className="invoice-footer-right">

                  <span>
                    Invoice generated electronically
                  </span>

                  <strong>
                    Thank you for choosing us!
                  </strong>

                </div>

              </div>


            </div>


          </div>

        </div>

      )}


      {/* =====================================================
          INVOICE HISTORY
          ===================================================== */}

      {showInvoiceHistory && (

        <div
          className="history-overlay"
          onClick={() =>
            setShowInvoiceHistory(
              false
            )
          }
        >

          <div
            className="history-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            <div className="history-header">

              <div>

                <h2>
                  Invoice History
                </h2>

                <span>
                  Previously generated invoices
                </span>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowInvoiceHistory(
                    false
                  )
                }
              >

                <X size={19} />

              </button>

            </div>


            <div className="history-content">


              {historyLoading ? (

                <div className="history-loading">

                  <Loader2
                    size={30}
                    className="spin"
                  />

                  <p>
                    Loading invoices...
                  </p>

                </div>

              ) : historyError ? (

                <div className="history-error">

                  {historyError}

                </div>

              ) : invoiceHistory.length ===
                0 ? (

                <div className="history-empty">

                  <FileText
                    size={42}
                  />

                  <p>
                    No invoices found.
                  </p>

                </div>

              ) : (

                <div className="history-table-wrapper">

                  <table className="history-table">

                    <thead>

                      <tr>

                        <th>
                          Invoice
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {invoiceHistory.map(
                        (
                          invoice,
                          index
                        ) => {


                          const number =
                            invoice.InvoiceNumber ||
                            invoice.invoiceNumber ||
                            `Invoice #${index + 1}`;


                          const date =
                            invoice.InvoiceDate ||
                            invoice.invoiceDate ||
                            invoice.CreatedAt ||
                            invoice.createdAt;


                          const customer =
                            invoice.CustomerName ||
                            invoice.FullName ||
                            invoice.customerName ||
                            invoice.Name ||
                            "-";


                          const invoiceTotal =
                            invoice.GrandTotal ??
                            invoice.grandTotal ??
                            invoice.Total ??
                            invoice.total ??
                            0;


                          return (

                            <tr
                              key={
                                invoice.InvoiceID ||
                                invoice.invoiceId ||
                                index
                              }
                            >

                              <td>
                                <strong>
                                  {number}
                                </strong>
                              </td>

                              <td>
                                {
                                  formatDate(
                                    date
                                  )
                                }
                              </td>

                              <td>
                                {customer}
                              </td>

                              <td className="history-total">

                                ₹
                                {money(
                                  invoiceTotal
                                )}

                              </td>

                              <td className="history-action">

                                <button
                                  type="button"
                                  title="View invoice"
                                  aria-label={`View ${number}`}
                                  onClick={() =>
                                    openHistoryInvoice(
                                      invoice
                                    )
                                  }
                                >

                                  <Eye
                                    size={16}
                                  />

                                </button>

                              </td>

                            </tr>

                          );

                        }
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>


          </div>

        </div>

      )}


    </div>

  );

}


export default Sales;