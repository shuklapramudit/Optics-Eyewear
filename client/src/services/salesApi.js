import API_BASE_URL from "./api.js";

const API = `${API_BASE_URL}/sales`;

// =====================================================
// GENERIC REQUEST FUNCTION
// =====================================================

const request = async (
  endpoint,
  options = {}
) => {
  const response = await fetch(
    `${API}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      "Server returned an invalid response."
    );
  }

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
      "Something went wrong."
    );
  }

  return data;
};

// =====================================================
// GET SALES FORM DATA
// =====================================================

export const getSalesFormData =
  async () => {

    const response =
      await request(
        "/form-data"
      );

    // -----------------------------------------------
    // BACKEND RESPONSE:
    //
    // {
    //   success: true,
    //   data: {
    //     customers: [],
    //     products: []
    //   }
    // }
    // -----------------------------------------------

    const formData =
      response?.data || {};

    const customers =
      Array.isArray(
        formData.customers
      )
        ? formData.customers
        : [];

    const products =
      Array.isArray(
        formData.products
      )
        ? formData.products
        : [];

    // =================================================
    // NORMALIZE CUSTOMERS
    // =================================================

    const normalizedCustomers =
      customers.map(
        (customer) => ({
          ...customer,

          CustomerID:
            customer.CustomerID ??
            customer.customerId ??
            customer.id,

          CustomerCode:
            customer.CustomerCode ??
            customer.customerCode ??
            "",

          FullName:
            customer.FullName ??
            customer.CustomerName ??
            customer.Name ??
            customer.name ??
            "",

          Phone:
            customer.Phone ??
            customer.MobileNumber ??
            customer.Mobile ??
            customer.phone ??
            "",

          Email:
            customer.Email ??
            customer.email ??
            "",

          Address:
            customer.Address ??
            customer.address ??
            "",

          City:
            customer.City ??
            customer.city ??
            "",

          State:
            customer.State ??
            customer.state ??
            "",
        })
      );

    // =================================================
    // NORMALIZE PRODUCTS
    // =================================================

    const normalizedProducts =
      products.map(
        (product) => {

          const sellingPrice =
            Number(
              product.SellingPrice ??
              product.SalePrice ??
              product.Price ??
              product.MRP ??
              0
            );

          const gstPercent =
            Number(
              product.GSTPercent ??
              product.GSTPercentage ??
              product.GSTRate ??
              0
            );

          return {
            ...product,

            ProductID:
              product.ProductID ??
              product.productId ??
              product.id,

            ProductCode:
              product.ProductCode ??
              product.productCode ??
              product.SKU ??
              "",

            ProductName:
              product.ProductName ??
              product.ProductName ??
              product.Name ??
              product.name ??
              "",

            ProductType:
              product.ProductType ??
              product.productType ??
              "",

            Description:
              product.Description ??
              product.description ??
              "",

            BrandID:
              product.BrandID ??
              product.brandId ??
              null,

            CategoryID:
              product.CategoryID ??
              product.categoryId ??
              null,

            Color:
              product.Color ??
              product.color ??
              "",

            Size:
              product.Size ??
              product.size ??
              "",

            // -----------------------------------------
            // IMPORTANT:
            // Keep all possible price names.
            // -----------------------------------------

            Price:
              sellingPrice,

            SellingPrice:
              sellingPrice,

            SalePrice:
              sellingPrice,

            MRP:
              Number(
                product.MRP ?? 0
              ),

            CostPrice:
              Number(
                product.CostPrice ?? 0
              ),

            GSTPercent:
              gstPercent,

            GSTRate:
              gstPercent,

            ReorderLevel:
              Number(
                product.ReorderLevel ?? 0
              ),

            Unit:
              product.Unit ??
              "Piece",

            ImageURL:
              product.ImageURL ??
              "",

            IsActive:
              product.IsActive ??
              1,
          };
        }
      );

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "=========================================="
    );

    console.log(
      "SALES FORM DATA - NORMALIZED"
    );

    console.log(
      "Customers:",
      normalizedCustomers
    );

    console.log(
      "Products:",
      normalizedProducts
    );

    console.log(
      "=========================================="
    );

    // =================================================
    // RETURN BOTH FORMATS
    //
    // This prevents existing Sales.jsx code from
    // breaking regardless of whether it uses:
    //
    // response.customers
    // response.data.customers
    //
    // response.products
    // response.data.products
    // =================================================

    return {
      success: true,

      data: {
        customers:
          normalizedCustomers,

        products:
          normalizedProducts,
      },

      customers:
        normalizedCustomers,

      products:
        normalizedProducts,
    };
  };

// =====================================================
// CREATE INVOICE
// =====================================================

export const createInvoice =
  async (
    payload
  ) => {

    console.log(
      "CREATE INVOICE PAYLOAD:",
      payload
    );

    return request(
      "/create-invoice",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );
  };

// =====================================================
// GET INVOICE HISTORY
// =====================================================

export const getInvoiceHistory =
  async () => {

    return request(
      "/invoices"
    );
  };

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  getSalesFormData,
  createInvoice,
  getInvoiceHistory,
};
