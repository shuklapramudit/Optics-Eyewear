import {
  useCallback,
  useState,
} from "react";

import {
  getSalesFormData,
  createInvoice,
} from "./salesService";

export default function useSales() {
  const [customers, setCustomers] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadFormData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getSalesFormData();

        setCustomers(
          data.customers || []
        );

        setProducts(
          data.products || []
        );

        return data;
      } catch (err) {
        setError(
          err.message ||
            "Unable to load sales data."
        );

        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

  const saveInvoice =
    useCallback(
      async (payload) => {
        return createInvoice(
          payload
        );
      },
      []
    );

  return {
    customers,
    products,
    loading,
    error,
    loadFormData,
    saveInvoice,
  };
}