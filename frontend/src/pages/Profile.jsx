import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function Profile() {
  const { user } = useAuth();
  const [userProjects, setUserProjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [contributions, setContributions] = useState([]);

  useEffect(() => {
    Promise.all([
      api.projects.getMy(),
      api.classes.getAll(),
      api.progress.getContributions().catch(() => ({ data: [] })),
    ]).then(([projsRes, classRes, contRes]) => {
      if (projsRes.success) setUserProjects(projsRes.data);
      if (classRes.success) setClasses(classRes.data);
      if (contRes.success) setContributions(contRes.data);
    });
  }, []);

  const badges = [
    { title: "Bug Hunter", icon: "🐛", desc: "Resolved 5 verified issues in project repositories" },
    { title: "Builder", icon: "🔧", desc: "Created 3 modular full-stack features" },
    { title: "Team Player", icon: "🤝", desc: "Collaborated on cross-functional tasks across 2 milestones" },
  ];

  return (
    <div className="dashboard-page">
      <Sidebar projects={userProjects} />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <span>ProjectHub</span>
            <span>›</span>
            <span>Profile</span>
          </div>
        </header>

        <div className="dashboard-content">
          {/* PROFILE HERO CARD */}
          <div
            style={{
              padding: "36px",
              borderRadius: "14px",
              background: "radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.12), transparent 40%), #0d0e13",
              border: "1px solid #282a34",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#21183a",
                color: "#a78bfa",
                fontSize: "24px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #8b5cf640",
              }}
            >
              {user?.avatar || "U"}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ margin: 0, fontSize: "24px" }}>{user?.name || "Developer"}</h1>
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: "20px",
                    background: "#181326",
                    border: "1px solid #382c56",
                    color: "#a78bfa",
                    fontSize: "10px",
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", color: "#71717a", fontSize: "12px" }}>
                @{user?.username} · {user?.email}
              </p>
              <p style={{ margin: "4px 0 0", color: "#a1a1aa", fontSize: "11px" }}>
                {user?.bio || "Educational Software Engineering Portfolio"}
              </p>
            </div>
          </div>

          {/* STATS */}
          <div className="stats-grid" style={{ marginBottom: "32px" }}>
            <div className="stat-card">
              <span className="stat-icon">⚡</span>
              <h3 className="stat-value">{user?.xp?.toLocaleString() || 0}</h3>
              <div className="stat-label">Total XP</div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">🏆</span>
              <h3 className="stat-value">{user?.points?.toLocaleString() || 0}</h3>
              <div className="stat-label">Contribution Points</div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">◇</span>
              <h3 className="stat-value">{userProjects.length}</h3>
              <div className="stat-label">Projects</div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">🎓</span>
              <h3 className="stat-value">{classes.length}</h3>
              <div className="stat-label">Enrolled Classes</div>
            </div>
          </div>

          {/* BADGES & ACHIEVEMENTS */}
          <div
            style={{
              padding: "24px",
              borderRadius: "10px",
              background: "#0d0e13",
              border: "1px solid #252832",
              marginBottom: "32px",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Earned Achievements</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {badges.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    background: "#111218",
                    border: "1px solid #20222a",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "28px" }}>{b.icon}</span>
                  <div>
                    <strong style={{ fontSize: "13px", display: "block", color: "#e4e4e7" }}>{b.title}</strong>
                    <span style={{ fontSize: "10px", color: "#71717a", display: "block", marginTop: "2px" }}>
                      {b.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ENROLLED CLASSES */}
          <div
            style={{
              padding: "24px",
              borderRadius: "10px",
              background: "#0d0e13",
              border: "1px solid #252832",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Classes & Courses</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {classes.length > 0 ? (
                classes.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "14px 18px",
                      borderRadius: "8px",
                      background: "#111218",
                      border: "1px solid #20222a",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13px", color: "#e4e4e7", display: "block" }}>{c.name}</strong>
                      <span style={{ fontSize: "10px", color: "#71717a" }}>
                        Instructor: {c.teacher_name} · {c.student_count || 0} Students
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "5px",
                        background: "#1c162e",
                        color: "#a78bfa",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {c.code}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: "#71717a", fontSize: "12px" }}>Not enrolled in any classes yet.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;