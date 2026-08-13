import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import {
  AuthProvider
} from "./context/AuthContext";

import ProtectedRoute from "./routes/ProtectedRoute";

// =====================================================
// INVENTORY CONTEXT
// =====================================================

import {
  InventoryProvider
} from "./pages/Inventory/InventoryContext";

// =====================================================
// PAGES
// =====================================================

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Customers from "./pages/Customers/Customers";
import Products from "./pages/Products/Products";
import Inventory from "./pages/Inventory/Inventory";
import Sales from "./pages/Sales/Sales";
import Purchases from "./pages/Purchases/Purchases";
import EyeTesting from "./pages/EyeTesting/EyeTesting";
import Orders from "./pages/Orders/Orders";
import Repairs from "./pages/Repairs/Repairs";
import Suppliers from "./pages/Suppliers/Suppliers";
import Payments from "./pages/Payments/Payments";
import Reports from "./pages/Reports/Reports";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <InventoryProvider>

          <Routes>

            {/* =========================================
                LOGIN
            ========================================= */}

            <Route
              path="/login"
              element={<Login />}
            />


            {/* =========================================
                PROTECTED APPLICATION
            ========================================= */}

            <Route
              element={<ProtectedRoute />}
            >

              {/* =========================================
                  DASHBOARD
              ========================================= */}

              <Route
                path="/"
                element={<Dashboard />}
              />


              {/* =========================================
                  CUSTOMERS
              ========================================= */}

              <Route
                path="/customers"
                element={<Customers />}
              />


              {/* =========================================
                  PRODUCTS
              ========================================= */}

              <Route
                path="/products"
                element={<Products />}
              />


              {/* =========================================
                  INVENTORY
              ========================================= */}

              <Route
                path="/inventory"
                element={<Inventory />}
              />


              {/* =========================================
                  SALES
              ========================================= */}

              <Route
                path="/sales"
                element={<Sales />}
              />


              {/* =========================================
                  PURCHASES
              ========================================= */}

              <Route
                path="/purchases"
                element={<Purchases />}
              />


              {/* =========================================
                  EYE TESTING
              ========================================= */}

              <Route
                path="/eye-testing"
                element={<EyeTesting />}
              />


              {/* =========================================
                  ORDERS
              ========================================= */}

              <Route
                path="/orders"
                element={<Orders />}
              />


              {/* =========================================
                  REPAIRS
              ========================================= */}

              <Route
                path="/repairs"
                element={<Repairs />}
              />


              {/* =========================================
                  SUPPLIERS
              ========================================= */}

              <Route
                path="/suppliers"
                element={<Suppliers />}
              />


              {/* =========================================
                  PAYMENTS
              ========================================= */}

              <Route
                path="/payments"
                element={<Payments />}
              />


              {/* =========================================
                  REPORTS
              ========================================= */}

              <Route
                path="/reports"
                element={<Reports />}
              />

            </Route>


            {/* =========================================
                UNKNOWN URL
            ========================================= */}

            <Route
              path="*"
              element={<Login />}
            />

          </Routes>

        </InventoryProvider>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;