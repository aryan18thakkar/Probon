import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import "../pages/Dashboard.css";

function Sidebar({ projects = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll({ limit: 15 });
      if (res.success && res.data) {
        setNotifications(res.data.items || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Could not load notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000); // Polling every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="dashboard-sidebar">
      <div
        className="dashboard-logo"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
      >
        Project<span>Hub</span>
      </div>

      <nav className="dashboard-nav">
        <div className="dashboard-nav-title">WORKSPACE</div>

        <button
          className={`dashboard-nav-item ${isActive("/dashboard") ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          <span className="dashboard-nav-icon">⌂</span>
          <span>Dashboard</span>
        </button>

        <button
          className={`dashboard-nav-item ${showNotifications ? "active" : ""}`}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <span className="dashboard-nav-icon">🔔</span>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: "700",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  marginLeft: "6px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </span>
        </button>

        {/* NOTIFICATIONS PANEL */}
        {showNotifications && (
          <div
            style={{
              padding: "10px",
              margin: "6px 0 12px",
              borderRadius: "8px",
              background: "#0c0d12",
              border: "1px solid #232530",
              fontSize: "11px",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "10px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Alerts & Updates
              </strong>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{ background: "none", border: "none", color: "#a78bfa", fontSize: "9px", cursor: "pointer", padding: 0 }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: n.is_read ? "#111218" : "#1e1b4b33",
                      border: `1px solid ${n.is_read ? "#1b1d24" : "#6366f140"}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: "10px", color: n.is_read ? "#d4d4d8" : "#e0e7ff" }}>
                        {n.title}
                      </strong>
                      <span style={{ fontSize: "8px", color: "#52525b" }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "9px", color: "#71717a", lineHeight: "1.3" }}>
                      {n.message}
                    </p>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: "10px", color: "#52525b", textAlign: "center", padding: "8px 0" }}>
                  No notifications yet.
                </span>
              )}
            </div>
          </div>
        )}

        <button
          className={`dashboard-nav-item ${isActive("/projects") ? "active" : ""}`}
          onClick={() => navigate("/projects")}
        >
          <span className="dashboard-nav-icon">◇</span>
          <span>Explore Projects</span>
        </button>

        <button
          className={`dashboard-nav-item ${isActive("/tasks") ? "active" : ""}`}
          onClick={() => navigate("/tasks")}
        >
          <span className="dashboard-nav-icon">✓</span>
          <span>My Tasks</span>
        </button>

        <button
          className={`dashboard-nav-item ${isActive("/chat") ? "active" : ""}`}
          onClick={() => navigate("/chat")}
        >
          <span className="dashboard-nav-icon">💬</span>
          <span>Group Chat</span>
        </button>

        <button
          className={`dashboard-nav-item ${isActive("/arena") ? "active" : ""}`}
          onClick={() => navigate("/arena")}
        >
          <span className="dashboard-nav-icon">⚡</span>
          <span>Weekly Arena</span>
        </button>

        {projects && projects.length > 0 && (
          <>
            <div className="dashboard-nav-title">YOUR PROJECTS</div>
            {projects.map((p) => {
              const initials = p.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
              return (
                <button
                  key={p.id}
                  className={`dashboard-nav-item ${
                    location.pathname === `/projects/${p.id}` ? "active" : ""
                  }`}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <span className="dashboard-nav-icon">{initials}</span>
                  <span>{p.name}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="dashboard-sidebar-bottom">
        <div
          className="user-mini"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/profile")}
        >
          <div className="user-avatar">{user?.avatar || "U"}</div>
          <div className="user-mini-info">
            <strong>{user?.name || "User"}</strong>
            <span>
              {user?.role === "teacher" ? "Instructor" : user?.rank || "Student"} · {user?.xp || 0} XP
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: "100%",
            marginTop: "8px",
            padding: "7px 10px",
            border: "1px solid #27272f",
            borderRadius: "6px",
            background: "#12131a",
            color: "#858995",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
