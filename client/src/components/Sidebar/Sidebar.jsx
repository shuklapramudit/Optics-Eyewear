import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Glasses,
  Package,
  ShoppingCart,
  ShoppingBag,
  Eye,
  ClipboardList,
  Wrench,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  X
} from "lucide-react";

import "./Sidebar.css";


function Sidebar({ isOpen, onClose }) {

  const menuItems = [

    {
      title: "Dashboard",
      path: "/",
      icon: LayoutDashboard
    },

    {
      title: "Customers",
      path: "/customers",
      icon: Users
    },

    {
      title: "Products",
      path: "/products",
      icon: Glasses
    },

    {
      title: "Inventory",
      path: "/inventory",
      icon: Package
    },

    {
      title: "Sales & Billing",
      path: "/sales",
      icon: ShoppingCart
    },

    {
      title: "Purchases",
      path: "/purchases",
      icon: ShoppingBag
    },

    {
      title: "Eye Testing",
      path: "/eye-testing",
      icon: Eye
    },

    {
      title: "Orders",
      path: "/orders",
      icon: ClipboardList
    },

    {
      title: "Repairs",
      path: "/repairs",
      icon: Wrench
    },

    {
      title: "Suppliers",
      path: "/suppliers",
      icon: Building2
    },

    {
      title: "Payments",
      path: "/payments",
      icon: CreditCard
    },

    {
      title: "Reports",
      path: "/reports",
      icon: BarChart3
    }

  ];


  /* ================================
     LOGOUT
  ================================= */

  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";

  };


  return (

    <>

      {/* Mobile Overlay */}

      {isOpen && (

        <div
          className="sidebar-overlay"
          onClick={onClose}
        ></div>

      )}


      {/* Sidebar */}

      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >

        {/* Logo */}

        <div className="sidebar-logo">

          <div className="logo-icon">

            <Glasses
              size={25}
              strokeWidth={2.2}
            />

          </div>


          <div className="logo-text">

            <h2>
              CHASHMA PLUS
            </h2>

            <span>
              Inventory System
            </span>

          </div>


          {/* Mobile Close */}

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >

            <X size={20} />

          </button>

        </div>


        {/* Menu */}

        <div className="sidebar-menu">

          <p className="menu-title">
            MAIN MENU
          </p>


          {menuItems.map((item) => {

            const Icon = item.icon;

            return (

              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
              >

                <Icon
                  size={19}
                  strokeWidth={2}
                />

                <span>
                  {item.title}
                </span>

              </NavLink>

            );

          })}


          {/* System */}

          <p className="menu-title settings-title">
            SYSTEM
          </p>


          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >

            <Settings
              size={19}
              strokeWidth={2}
            />

            <span>
              Settings
            </span>

          </NavLink>

        </div>


        {/* Bottom */}

        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="user-avatar">
              SA
            </div>


            <div>

              <strong>
                System Administrator
              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>


          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >

            <LogOut size={18} />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

    </>

  );

}

export default Sidebar;