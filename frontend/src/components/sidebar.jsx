import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/Dashboard.css";

function Sidebar({ projects = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
