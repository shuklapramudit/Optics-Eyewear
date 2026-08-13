import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  fetchInventory,
  fetchInventorySummary,
  changeInventoryStock,
} from "./inventoryService.js";

const InventoryContext =
  createContext(null);

export const InventoryProvider = ({
  children,
}) => {
  const [
    inventory,
    setInventory,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    TotalProducts: 0,
    TotalStock: 0,
    ReservedStock: 0,
    AvailableStock: 0,
    InventoryValue: 0,
    LowStock: 0,
    OutOfStock: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  const loadInventory =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          inventoryData,
          summaryData,
        ] = await Promise.all([
          fetchInventory(),
          fetchInventorySummary(),
        ]);

        setInventory(
          inventoryData.inventory ||
            []
        );

        setSummary(
          summaryData.summary ||
            {}
        );

      } catch (err) {
        console.error(
          "Inventory Load Error:",
          err
        );

        setError(
          err.message ||
            "Unable to load inventory."
        );

      } finally {
        setLoading(false);
      }
    }, []);

  // =====================================================
  // STOCK CHANGE
  // =====================================================

  const updateStock = async (
    payload
  ) => {
    const result =
      await changeInventoryStock(
        payload
      );

    await loadInventory();

    return result;
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        summary,
        loading,
        error,
        loadInventory,
        updateStock,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventoryContext =
  () => {
    const context =
      useContext(
        InventoryContext
      );

    if (!context) {
      throw new Error(
        "useInventoryContext must be used inside InventoryProvider."
      );
    }

    return context;
  };

export default InventoryContext;