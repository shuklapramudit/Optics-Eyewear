import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  Bell,
  Search,
  UserCircle,
  ShoppingCart,
  Package,
  Eye,
  Receipt,
  Check,
  CheckCheck,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./Header.css";

function Header({ onMenuClick }) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);

  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notificationRef = useRef(null);

  // =====================================================
  // GET USER
  // =====================================================

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Unable to read user information:", error);
    }
  }, []);

  // =====================================================
  // USER NAME
  // =====================================================

  const userName =
    currentUser?.FullName ||
    currentUser?.fullName ||
    currentUser?.name ||
    currentUser?.username ||
    "System Administrator";

  // =====================================================
  // USER ROLE
  // =====================================================

  const userRole =
    currentUser?.Role || currentUser?.role || currentUser?.userRole || "Admin";

  // =====================================================
  // INITIALS
  // =====================================================

  const getInitials = (name) => {
    if (!name) {
      return "SA";
    }

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const userInitials = getInitials(userName);

  // =====================================================
  // NOTIFICATION ICON
  // =====================================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart size={17} />;

      case "sale":
        return <Receipt size={17} />;

      case "eye_test":
        return <Eye size={17} />;

      case "product":
        return <Package size={17} />;

      default:
        return <Bell size={17} />;
    }
  };

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const response = await fetch(
        "https://inventry-management-system-k9a5.onrender.com/api/notifications",
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setNotifications(
          Array.isArray(data.notifications) ? data.notifications : [],
        );
      }
    } catch (error) {
      console.error("Notification loading error:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =====================================================
  // CLOSE NOTIFICATION WHEN CLICKING OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // =====================================================
  // UNREAD COUNT
  // =====================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  // =====================================================
  // MARK SINGLE AS READ
  // =====================================================

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Mark notification read error:", error);
    }
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = async () => {
    try {
      await fetch("http://localhost:5000/api/notifications/read-all", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (error) {
      console.error("Mark all notifications read error:", error);
    }
  };

  // =====================================================
  // NOTIFICATION CLICK
  // =====================================================

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    setShowNotifications(false);

    // =================================================
    // NAVIGATION
    // =================================================

    if (notification.type === "purchase") {
      navigate("/purchases");
      return;
    }

    if (notification.type === "sale") {
      navigate("/sales");
      return;
    }

    if (notification.type === "eye_test") {
      navigate("/eye-testing");
      return;
    }

    if (notification.type === "product") {
      navigate("/products");
      return;
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatNotificationTime = (date) => {
    if (!date) {
      return "";
    }

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) {
      return "";
    }

    const now = new Date();

    const difference = now.getTime() - notificationDate.getTime();

    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days = Math.floor(hours / 24);

    if (days === 1) {
      return "Yesterday";
    }

    if (days < 7) {
      return `${days} days ago`;
    }

    return notificationDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <header className="app-header">
      {/* =================================================
          LEFT
      ================================================= */}

      <div className="header-left">
        <button
          type="button"
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-search">
          <Search size={17} />

          <input type="text" placeholder="Search anything..." />
        </div>
      </div>

      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="header-right">
        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <div className="notification-wrapper" ref={notificationRef}>
          <button
            type="button"
            className={`notification-button ${
              showNotifications ? "active" : ""
            }`}
            aria-label="Notifications"
            onClick={() => setShowNotifications((previous) => !previous)}
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* =================================================
              NOTIFICATION DROPDOWN
          ================================================= */}

          {showNotifications && (
            <div className="notification-dropdown">
              {/* HEADER */}

              <div className="notification-dropdown-header">
                <div>
                  <h3>Notifications</h3>

                  <span>
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount > 1 ? "s" : ""
                        }`
                      : "You're all caught up"}
                  </span>
                </div>

                <div className="notification-header-actions">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="mark-all-button"
                      onClick={markAllAsRead}
                      title="Mark all as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="notification-close-button"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* BODY */}

              <div className="notification-list">
                {loadingNotifications && notifications.length === 0 ? (
                  <div className="notification-loading">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notification-empty">
                    <div className="notification-empty-icon">
                      <Bell size={24} />
                    </div>

                    <strong>No notifications</strong>

                    <span>
                      New purchases, sales, products and eye tests will appear
                      here.
                    </span>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      className={`notification-item ${
                        notification.isRead ? "read" : "unread"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`notification-icon ${notification.type}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="notification-content">
                        <div className="notification-title-row">
                          <strong>{notification.title}</strong>

                          {!notification.isRead && (
                            <span className="unread-dot"></span>
                          )}
                        </div>

                        <p>{notification.message}</p>

                        <span className="notification-time">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>

                      {!notification.isRead && (
                        <div
                          className="notification-check"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* FOOTER */}

              {notifications.length > 0 && (
                <div className="notification-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            USER
        ================================================= */}

        <div className="header-user">
          <div className="header-avatar">{userInitials}</div>

          <div className="header-user-info">
            <strong>{userName}</strong>

            <span>{userRole}</span>
          </div>

          <UserCircle size={19} />
        </div>
      </div>
    </header>
  );
}

export default Header;
