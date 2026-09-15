import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Projectcard from "../components/projectcard";
import { api } from "../api/client";

function Explore() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allRes, myRes] = await Promise.all([
          api.projects.getAll({ search: search.trim() || undefined }),
          api.projects.getMy(),
        ]);
        if (allRes.success) setProjects(allRes.data);
        if (myRes.success) setUserProjects(myRes.data);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="dashboard-page">
      <Sidebar projects={userProjects} />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <span style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
              ProjectHub
            </span>
            <span>›</span>
            <span>Explore Projects</span>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <div className="welcome-label">DISCOVER & COLLABORATE</div>
              <h1>
                Explore Projects <span>◇</span>
              </h1>
              <p className="welcome-description">
                Discover active class capstones, open source initiatives, and developer teams.
              </p>
            </div>
          </section>

          {/* SEARCH BAR */}
          <div style={{ marginBottom: "28px", maxWidth: "500px" }}>
            <input
              type="text"
              placeholder="Search by project name or technology..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: "44px",
                padding: "0 14px",
                borderRadius: "8px",
                background: "#0d0e13",
                border: "1px solid #252832",
                color: "#eeeeef",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          {loading ? (
            <div style={{ color: "#71717a" }}>Loading projects...</div>
          ) : projects.length > 0 ? (
            <div className="project-grid">
              {projects.map((project) => (
                <Projectcard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "45px",
                borderRadius: "10px",
                background: "#0d0e13",
                border: "1px dashed #252832",
                textAlign: "center",
                color: "#6f7380",
                fontSize: "12px",
              }}
            >
              No matching projects found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Explore;