import React, { useState } from "react";

import {
  Navigate,
  Outlet
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";

import "../App.css";

const ProtectedRoute = () => {

  const {
    isAuthenticated,
    loading
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);


  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="route-loading">
        Loading...
      </div>
    );
  }


  /* =========================================
     NOT AUTHENTICATED
  ========================================= */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /* =========================================
     APPLICATION SHELL
  ========================================= */

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />


      {/* MAIN AREA */}

      <div className="app-main">

        {/* HEADER */}

        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />


        {/* PAGE CONTENT */}

        <main className="app-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
};

export default ProtectedRoute;