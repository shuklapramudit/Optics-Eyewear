import React, {
  createContext,
  useContext,
  useState,
} from "react";

const SalesContext =
  createContext(null);

export function SalesProvider({
  children,
}) {
  const [currentInvoice, setCurrentInvoice] =
    useState(null);

  const [invoiceHistory, setInvoiceHistory] =
    useState([]);

  const value = {
    currentInvoice,
    setCurrentInvoice,

    invoiceHistory,
    setInvoiceHistory,
  };

  return (
    <SalesContext.Provider
      value={value}
    >
      {children}
    </SalesContext.Provider>
  );
}

export const useSalesContext = () => {
  const context =
    useContext(SalesContext);

  if (!context) {
    throw new Error(
      "useSalesContext must be used inside SalesProvider."
    );
  }

  return context;
};

export default SalesContext;