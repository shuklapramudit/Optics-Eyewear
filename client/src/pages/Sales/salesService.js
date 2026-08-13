const API = "http://localhost:5000/api/sales";

const request = async (
  endpoint,
  options = {}
) => {
  const response = await fetch(
    `${API}${endpoint}`,
    {
      headers: {
        "Content-Type":
          "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  const data =
    await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ||
        "Something went wrong."
    );
  }

  return data;
};

export const getSalesFormData =
  async () => {
    return request(
      "/form-data"
    );
  };

export const createInvoice =
  async (payload) => {
    return request(
      "/create-invoice",
      {
        method: "POST",
        body: JSON.stringify(
          payload
        ),
      }
    );
  };

export const getInvoiceHistory =
  async () => {
    return request(
      "/invoices"
    );
  };

export default {
  getSalesFormData,
  createInvoice,
  getInvoiceHistory,
};