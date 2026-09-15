import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teams, setTeams] = useState([]);

  // Teacher Class Management
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [createdClassCode, setCreatedClassCode] = useState(null);
  const [classCreateError, setClassCreateError] = useState("");

  // Teacher Team Management
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamClassId, setNewTeamClassId] = useState("");
  const [teamCreateError, setTeamCreateError] = useState("");

  // Class Roster & Details Modal
  const [selectedClassIdForRoster, setSelectedClassIdForRoster] = useState(null);
  const [classRosterData, setClassRosterData] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Create Project Form
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [projectTags, setProjectTags] = useState("React, Node.js");
  const [createError, setCreateError] = useState("");
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Join Class Form
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.progress.getDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
      let fetchedClasses = [];
      const classRes = await api.classes.getAll();
      if (classRes.success) {
        fetchedClasses = classRes.data || [];
        setClasses(fetchedClasses);
        setSelectedClassId((prev) => {
          if (prev && fetchedClasses.some((c) => Number(c.id) === Number(prev))) return prev;
          return fetchedClasses.length > 0 ? fetchedClasses[0].id : "";
        });
        setNewTeamClassId((prev) => {
          if (prev && fetchedClasses.some((c) => Number(c.id) === Number(prev))) return prev;
          return fetchedClasses.length > 0 ? fetchedClasses[0].id : "";
        });
      }
      const teamRes = await api.teams.getAll();
      if (teamRes.success) {
        const fetchedTeams = teamRes.data || [];
        setTeams(fetchedTeams);
        setSelectedTeamId((prev) => {
          if (prev && fetchedTeams.some((t) => Number(t.id) === Number(prev))) return prev;
          const activeClassId = selectedClassId || (fetchedClasses.length > 0 ? fetchedClasses[0].id : null);
          const matching = fetchedTeams.filter((t) => Number(t.class_id) === Number(activeClassId));
          return matching.length > 0 ? matching[0].id : "";
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setClassCreateError("");
    try {
      const res = await api.classes.create({
        name: newClassName,
        description: newClassDesc,
      });
      setCreatedClassCode(res.data.code);
      setNewClassName("");
      setNewClassDesc("");
      loadDashboard();
    } catch (err) {
      setClassCreateError(err.message || "Failed to create class.");
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setTeamCreateError("");
    if (!newTeamClassId) {
      setTeamCreateError("Please select a class for this team.");
      return;
    }
    try {
      await api.teams.create({
        name: newTeamName,
        classId: parseInt(newTeamClassId, 10),
      });
      setShowCreateTeamModal(false);
      setNewTeamName("");
      loadDashboard();
      if (selectedClassIdForRoster && parseInt(newTeamClassId, 10) === parseInt(selectedClassIdForRoster, 10)) {
        handleOpenRoster(selectedClassIdForRoster);
      }
    } catch (err) {
      setTeamCreateError(err.message || "Failed to create team.");
    }
  };

  const handleOpenRoster = async (classId) => {
    setSelectedClassIdForRoster(classId);
    setRosterLoading(true);
    try {
      const res = await api.classes.getById(classId);
      if (res.success) {
        setClassRosterData(res.data);
      }
    } catch (err) {
      alert("Failed to load class roster details.");
    } finally {
      setRosterLoading(false);
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    if (!confirm("Are you sure you want to remove this student from the class?")) return;
    try {
      await api.classes.removeStudent(classId, studentId);
      handleOpenRoster(classId);
      loadDashboard();
    } catch (err) {
      alert(err.message || "Failed to remove student.");
    }
  };

  const availableTeams = teams.filter((t) => Number(t.class_id) === Number(selectedClassId));

  const handleSelectClassForProject = (classId) => {
    setSelectedClassId(classId);
    const matching = teams.filter((t) => Number(t.class_id) === Number(classId));
    if (matching.length > 0) {
      setSelectedTeamId(matching[0].id);
    } else {
      setSelectedTeamId("");
    }
  };

  const handleOpenCreateProjectModal = (specificClassId = null) => {
    setCreateError("");
    let curClassId = specificClassId || selectedClassId;
    if (!curClassId && classes.length > 0) {
      curClassId = classes[0].id;
    }
    setSelectedClassId(curClassId || "");

    if (curClassId) {
      const matching = teams.filter((t) => Number(t.class_id) === Number(curClassId));
      if (matching.length > 0) {
        setSelectedTeamId(matching[0].id);
      } else {
        setSelectedTeamId("");
      }
    } else {
      setSelectedTeamId("");
    }
    setShowCreateModal(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!projectName.trim()) {
      setCreateError("Please enter a project name.");
      return;
    }

    if (!selectedClassId) {
      setCreateError("Please select a class for this project.");
      return;
    }

    if (!selectedTeamId) {
      setCreateError("Please select a team for this project. If no teams exist in this class, please create a team first.");
      return;
    }

    setIsSubmittingProject(true);
    try {
      const tagsArray = projectTags.split(",").map((t) => t.trim()).filter(Boolean);
      await api.projects.create({
        name: projectName.trim(),
        description: projectDesc.trim(),
        teamId: parseInt(selectedTeamId, 10),
        classId: parseInt(selectedClassId, 10),
        tags: tagsArray,
      });

      setShowCreateModal(false);
      setProjectName("");
      setProjectDesc("");
      await loadDashboard();
    } catch (err) {
      console.error("Failed to create project:", err);
      setCreateError(err.message || "Failed to create project.");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    setJoinError("");
    setJoinSuccess("");

    try {
      const res = await api.classes.join(joinCode);
      setJoinSuccess(`Joined class ${res.data.name}!`);
      setJoinCode("");
      loadDashboard();
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinSuccess("");
      }, 1200);
    } catch (err) {
      setJoinError(err.message || "Failed to join class.");
    }
  };

  const stats = dashboardData?.stats || {
    totalXp: user?.xp || 0,
    contributionPoints: user?.points || 0,
    projectCount: 0,
    communityRank: "#1",
  };

  const projects = dashboardData?.projects || [];
  const activities = dashboardData?.recentActivities || [];

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).toUpperCase();

  return (
    <div className="dashboard-page">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          Project<span>Hub</span>
        </div>

        <nav className="dashboard-nav">
          <div className="dashboard-nav-title">WORKSPACE</div>

          <button className="dashboard-nav-item active">
            <span className="dashboard-nav-icon">⌂</span>
            <span>Dashboard</span>
          </button>

          <button
            className="dashboard-nav-item"
            onClick={() => navigate("/projects")}
          >
            <span className="dashboard-nav-icon">◇</span>
            <span>Explore Projects</span>
          </button>

          <button
            className="dashboard-nav-item"
            onClick={() => navigate("/tasks")}
          >
            <span className="dashboard-nav-icon">✓</span>
            <span>My Tasks</span>
          </button>

          <button
            className="dashboard-nav-item"
            onClick={() => navigate("/chat")}
          >
            <span className="dashboard-nav-icon">💬</span>
            <span>Group Chat</span>
          </button>

          <button
            className="dashboard-nav-item"
            onClick={() => navigate("/arena")}
          >
            <span className="dashboard-nav-icon">⚡</span>
            <span>Weekly Arena</span>
          </button>

          <div className="dashboard-nav-title">YOUR PROJECTS</div>

          {projects.length > 0 ? (
            projects.map((p) => {
              const initials = p.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
              return (
                <button
                  key={p.id}
                  className="dashboard-nav-item"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <span className="dashboard-nav-icon">{initials}</span>
                  <span>{p.name}</span>
                </button>
              );
            })
          ) : (
            <div style={{ padding: "8px 12px", color: "#555965", fontSize: "11px" }}>
              No projects yet
            </div>
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
                {user?.role === "teacher" ? "Instructor" : (user?.rank || "Student")} · {user?.xp || 0} XP
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

      {/* MAIN */}
      <main className="dashboard-main">
        {/* TOPBAR */}
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <span>ProjectHub</span>
            <span>›</span>
            <span>Dashboard</span>
          </div>

          <div className="topbar-actions">
            <button
              className="topbar-button"
              title={user?.role === "teacher" ? "Create Class" : "Join Class"}
              onClick={() => (user?.role === "teacher" ? setShowCreateClassModal(true) : setShowJoinModal(true))}
            >
              +
            </button>
            <button
              className="topbar-button"
              title="Profile"
              onClick={() => navigate("/profile")}
            >
              ⚙
            </button>
            <div
              className="topbar-profile"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/profile")}
            >
              <div className="topbar-avatar">{user?.avatar || "U"}</div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="dashboard-content">
          {/* WELCOME */}
          <section className="welcome-section">
            <div>
              <div className="welcome-label">{todayStr}</div>
              <h1>
                Welcome back, {user?.name?.split(" ")[0] || "Developer"} <span>👋</span>
              </h1>
              <p className="welcome-description">
                {user?.role === "teacher"
                  ? "Manage your classes, automatically generate and copy join codes, inspect student rosters, and track team projects."
                  : "Here's what's happening with your projects and assigned tasks."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {user?.role === "teacher" ? (
                <>
                  <button
                    className="secondary-button"
                    style={{ fontSize: "11px", padding: "10px 14px" }}
                    onClick={() => setShowCreateClassModal(true)}
                  >
                    + Create Class
                  </button>
                  <button
                    className="secondary-button"
                    style={{ fontSize: "11px", padding: "10px 14px" }}
                    onClick={() => setShowCreateTeamModal(true)}
                  >
                    + Create Team
                  </button>
                  <button
                    className="create-project-button"
                    onClick={() => handleOpenCreateProjectModal()}
                  >
                    + Create Project
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="secondary-button"
                    style={{ fontSize: "11px", padding: "10px 14px" }}
                    onClick={() => setShowJoinModal(true)}
                  >
                    Join Class
                  </button>
                  <button
                    className="create-project-button"
                    onClick={() => handleOpenCreateProjectModal()}
                  >
                    + Create Project
                  </button>
                </>
              )}
            </div>
          </section>

          {/* STATS */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-icon">⚡</span>
                <span className="stat-change">
                  {stats.weeklyXpText || (stats.weeklyXp > 0 ? `+${stats.weeklyXp} this week` : "0 this week")}
                </span>
              </div>
              <h3 className="stat-value">{stats.totalXp?.toLocaleString() || 0}</h3>
              <div className="stat-label">Total XP</div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-icon">🏆</span>
                <span className="stat-change">
                  {stats.weeklyPointsText || (stats.weeklyPoints > 0 ? `+${stats.weeklyPoints} pts this week` : "0 pts this week")}
                </span>
              </div>
              <h3 className="stat-value">{stats.contributionPoints?.toLocaleString() || 0}</h3>
              <div className="stat-label">Contribution Points</div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-icon">◇</span>
                <span className="stat-change">{stats.activeProjectCount ?? projects.length} active</span>
              </div>
              <h3 className="stat-value">{stats.projectCount ?? projects.length}</h3>
              <div className="stat-label">Projects</div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-icon">↗</span>
                <span className="stat-change">{stats.communityTier || "Active Member"}</span>
              </div>
              <h3 className="stat-value">{stats.communityRank || "#1"}</h3>
              <div className="stat-label">Community Rank</div>
            </div>
          </section>

          {/* TEACHER CLASS MANAGEMENT SECTION */}
          {user?.role === "teacher" && (
            <section className="dashboard-section" style={{ marginTop: "32px", marginBottom: "32px" }}>
              <div className="section-header-dashboard">
                <div>
                  <h2>Class Management & Student Rosters</h2>
                  <p>Your managed courses, student rosters, join codes, and teams.</p>
                </div>
                <button
                  className="create-project-button"
                  style={{ fontSize: "11px", padding: "8px 12px" }}
                  onClick={() => setShowCreateClassModal(true)}
                >
                  + Create New Class
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <div
                      key={cls.id}
                      style={{
                        padding: "20px",
                        borderRadius: "10px",
                        background: "#0d0e13",
                        border: "1px solid #252832",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <h3 style={{ margin: 0, fontSize: "16px", color: "#f4f4f5" }}>{cls.name}</h3>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 8px",
                              background: "#191528",
                              borderRadius: "6px",
                              border: "1px solid #332352",
                            }}
                          >
                            <span style={{ fontSize: "9px", color: "#a1a1aa", fontWeight: "600" }}>CODE:</span>
                            <code style={{ fontSize: "12px", color: "#c084fc", fontWeight: "700", letterSpacing: "1px" }}>
                              {cls.code}
                            </code>
                            <button
                              onClick={() => handleCopyCode(cls.code)}
                              style={{
                                background: copiedCode === cls.code ? "#22c55e" : "#282a36",
                                color: copiedCode === cls.code ? "#000" : "#d8b4fe",
                                border: "none",
                                borderRadius: "4px",
                                padding: "2px 6px",
                                fontSize: "9px",
                                fontWeight: "700",
                                cursor: "pointer",
                                transition: "0.2s",
                              }}
                              title="Copy join code for students"
                            >
                              {copiedCode === cls.code ? "✓ Copied" : "📋 Copy"}
                            </button>
                          </span>
                        </div>

                        <p style={{ color: "#71717a", fontSize: "11px", margin: "0 0 16px", lineHeight: "1.5" }}>
                          {cls.description || "No description provided."}
                        </p>

                        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                          <div style={{ padding: "6px 10px", borderRadius: "6px", background: "#111218", border: "1px solid #1f2028", fontSize: "10px", color: "#a1a1aa" }}>
                            👥 <strong style={{ color: "#e4e4e7" }}>{cls.student_count ?? 0}</strong> Students
                          </div>
                          <div style={{ padding: "6px 10px", borderRadius: "6px", background: "#111218", border: "1px solid #1f2028", fontSize: "10px", color: "#a1a1aa" }}>
                            🤝 <strong style={{ color: "#e4e4e7" }}>{cls.team_count ?? 0}</strong> Teams
                          </div>
                          <div style={{ padding: "6px 10px", borderRadius: "6px", background: "#111218", border: "1px solid #1f2028", fontSize: "10px", color: "#a1a1aa" }}>
                            📁 <strong style={{ color: "#e4e4e7" }}>{cls.project_count ?? 0}</strong> Projects
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #1f2028", paddingTop: "14px" }}>
                        <button
                          className="secondary-button"
                          style={{ flex: 1, fontSize: "10px", padding: "7px 10px" }}
                          onClick={() => handleOpenRoster(cls.id)}
                        >
                          View Roster & Teams
                        </button>
                        <button
                          className="secondary-button"
                          style={{ fontSize: "10px", padding: "7px 10px" }}
                          onClick={() => {
                            setSelectedClassId(cls.id);
                            setNewTeamClassId(cls.id);
                            setShowCreateTeamModal(true);
                          }}
                          title="Add team to this class"
                        >
                          + Team
                        </button>
                        <button
                          className="primary-button"
                          style={{ fontSize: "10px", padding: "7px 10px" }}
                          onClick={() => handleOpenCreateProjectModal(cls.id)}
                          title="Create project in this class"
                        >
                          + Project
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "32px",
                      borderRadius: "10px",
                      background: "#0d0e13",
                      border: "1px dashed #252832",
                      textAlign: "center",
                      color: "#71717a",
                      fontSize: "12px",
                    }}
                  >
                    <p>You have not created any classes yet.</p>
                    <button
                      className="create-project-button"
                      style={{ marginTop: "10px" }}
                      onClick={() => setShowCreateClassModal(true)}
                    >
                      + Create Your First Class
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* PROJECTS */}
          <section className="dashboard-section">
            <div className="section-header-dashboard">
              <div>
                <h2>Your Projects</h2>
                <p>Projects you are currently working on.</p>
              </div>
              <span className="view-all" onClick={() => navigate("/projects")}>
                View all →
              </span>
            </div>

            <div className="project-grid">
              {projects.length > 0 ? (
                projects.map((project) => {
                  const initials = project.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={project.id}
                      className="dashboard-project-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="project-card-top">
                        <div className="project-card-icon">{initials}</div>
                        <div className="project-status">
                          <span className="project-status-dot"></span>
                          {project.status?.toUpperCase() || "ACTIVE"}
                        </div>
                      </div>

                      <h3>{project.name}</h3>
                      <p>{project.description}</p>

                      <div className="project-tags">
                        {project.tags?.map((t, i) => (
                          <span key={i}>{t}</span>
                        ))}
                      </div>

                      <div className="project-progress">
                        <div className="project-progress-header">
                          <span>Project Progress</span>
                          <strong>{project.progress || 0}%</strong>
                        </div>
                        <div className="project-progress-bar">
                          <div style={{ width: `${project.progress || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "32px",
                    borderRadius: "10px",
                    background: "#0d0e13",
                    border: "1px dashed #252832",
                    textAlign: "center",
                    color: "#6f7380",
                    fontSize: "12px",
                  }}
                >
                  <p>You have not joined or created any projects yet.</p>
                  <button
                    className="create-project-button"
                    style={{ marginTop: "10px" }}
                    onClick={() => handleOpenCreateProjectModal()}
                  >
                    + Create Your First Project
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* LOWER SECTION */}
          <div className="dashboard-lower-grid">
            {/* WEEKLY ARENA */}
            <section className="arena-card">
              <div className="arena-header">
                <div>
                  <div className="arena-label">WEEKLY ARENA</div>
                  <h3>Code. Solve. Contribute.</h3>
                  <p>
                    Complete this week's challenges to earn double XP and contribution points.
                  </p>
                </div>
                <div className="arena-xp">2× XP</div>
              </div>

              <div className="arena-task-list">
                <div className="arena-task">
                  <strong>Fix a project issue</strong>
                  <span>Debug and submit a solution</span>
                  <span className="arena-task-xp">+200 XP</span>
                </div>

                <div className="arena-task">
                  <strong>Improve existing code</strong>
                  <span>Refactor a project component</span>
                  <span className="arena-task-xp">+150 XP</span>
                </div>

                <div className="arena-task">
                  <strong>Help another developer</strong>
                  <span>Review or contribute to a project</span>
                  <span className="arena-task-xp">+250 XP</span>
                </div>

                <div className="arena-task">
                  <strong>Solve the weekly challenge</strong>
                  <span>Complete the community challenge</span>
                  <span className="arena-task-xp">+300 XP</span>
                </div>
              </div>
            </section>

            {/* ACTIVITY */}
            <section className="activity-card">
              <h3>Recent Activity</h3>

              <div className="activity-list">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <div key={act.id} className="activity-item">
                      <div className="activity-icon">✓</div>
                      <div className="activity-info">
                        <strong>{act.description}</strong>
                        <span>
                          {act.project_name || "Project"} · {new Date(act.recorded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "15px 0", color: "#666a76", fontSize: "11px" }}>
                    No recent activities recorded yet. Complete tasks or contribute to earn XP!
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="auth-box"
            style={{ maxWidth: "480px", background: "#101116", border: "1px solid #282a34" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0 }}>Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "11px" }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <label>Project Name</label>
              <input
                type="text"
                placeholder="e.g. AI Interview Platform"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />

              <label>Description</label>
              <input
                type="text"
                placeholder="Short description of your project"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                required
              />

              <label>Class</label>
              {classes.length > 0 ? (
                <select
                  value={selectedClassId}
                  onChange={(e) => handleSelectClassForProject(e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 13px",
                    marginBottom: "19px",
                    border: "1px solid #2b2e38",
                    borderRadius: "7px",
                    background: "#0b0c10",
                    color: "#eeeeef",
                    fontSize: "12px",
                  }}
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ marginBottom: "19px", padding: "12px", background: "#161821", border: "1px dashed #2e3240", borderRadius: "8px" }}>
                  <p style={{ color: "#e4e4e7", fontSize: "12px", margin: "0 0 8px" }}>
                    {user?.role === "teacher"
                      ? "No classes found. Please create a class first."
                      : "You are not enrolled in any classes yet."}
                  </p>
                  {user?.role === "teacher" ? (
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "6px 12px" }}
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowCreateClassModal(true);
                      }}
                    >
                      + Create Class First
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "6px 12px" }}
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowJoinModal(true);
                      }}
                    >
                      Join Class First
                    </button>
                  )}
                </div>
              )}

              <label>Team</label>
              {availableTeams.length > 0 ? (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 13px",
                    marginBottom: "19px",
                    border: "1px solid #2b2e38",
                    borderRadius: "7px",
                    background: "#0b0c10",
                    color: "#eeeeef",
                    fontSize: "12px",
                  }}
                  required
                >
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ marginBottom: "19px", padding: "12px", background: "#161821", border: "1px dashed #2e3240", borderRadius: "8px" }}>
                  <p style={{ color: "#e4e4e7", fontSize: "12px", margin: "0 0 8px" }}>
                    No teams exist in this class yet. Projects must belong to a team.
                  </p>
                  {user?.role === "teacher" ? (
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "6px 12px" }}
                      onClick={() => {
                        if (selectedClassId) setNewTeamClassId(selectedClassId);
                        setShowCreateModal(false);
                        setShowCreateTeamModal(true);
                      }}
                    >
                      + Create Team for this Class
                    </button>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#858995" }}>
                      Please ask your teacher to create a team in this class first.
                    </span>
                  )}
                </div>
              )}

              <label>Tech Stack / Tags (comma separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, MongoDB"
                value={projectTags}
                onChange={(e) => setProjectTags(e.target.value)}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                  disabled={isSubmittingProject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ flex: 1 }}
                  disabled={isSubmittingProject || classes.length === 0 || availableTeams.length === 0}
                >
                  {isSubmittingProject ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN CLASS MODAL */}
      {showJoinModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="auth-box"
            style={{ maxWidth: "420px", background: "#101116", border: "1px solid #282a34" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0 }}>Join a Class</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "#71717a", fontSize: "12px", marginBottom: "16px" }}>
              Enter the unique 6-character code provided by your instructor.
            </p>

            {joinError && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "11px" }}>
                {joinError}
              </div>
            )}
            {joinSuccess && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", fontSize: "11px" }}>
                {joinSuccess}
              </div>
            )}

            <form onSubmit={handleJoinClass}>
              <label>Class Code</label>
              <input
                type="text"
                placeholder="e.g. CS401A"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ flex: 1 }}
                >
                  Join Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL (TEACHER) */}
      {showCreateClassModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="auth-box"
            style={{ maxWidth: "440px", background: "#101116", border: "1px solid #282a34" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0 }}>Create New Class</h2>
              <button
                onClick={() => {
                  setShowCreateClassModal(false);
                  setCreatedClassCode(null);
                }}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {createdClassCode ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#14291f", color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "20px" }}>
                  ✓
                </div>
                <h3 style={{ fontSize: "17px", margin: "0 0 8px", color: "#f4f4f5" }}>Class Created Successfully!</h3>
                <p style={{ color: "#a1a1aa", fontSize: "12px", margin: "0 0 20px" }}>
                  Share this auto-generated unique class code with your students to let them join:
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    background: "#181326",
                    border: "1px solid #3b2865",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                  }}
                >
                  <code style={{ fontSize: "24px", fontWeight: "800", color: "#c084fc", letterSpacing: "3px" }}>
                    {createdClassCode}
                  </code>
                  <button
                    onClick={() => handleCopyCode(createdClassCode)}
                    className="primary-button"
                    style={{ fontSize: "11px", padding: "8px 14px" }}
                  >
                    {copiedCode === createdClassCode ? "✓ Copied!" : "📋 Copy Code"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowCreateClassModal(false);
                    setCreatedClassCode(null);
                  }}
                  className="secondary-button"
                  style={{ width: "100%", padding: "10px" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateClass}>
                <p style={{ color: "#71717a", fontSize: "12px", marginBottom: "16px" }}>
                  A unique 6-character class code will be automatically generated by the backend.
                </p>

                {classCreateError && (
                  <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "11px" }}>
                    {classCreateError}
                  </div>
                )}

                <label>Class Name</label>
                <input
                  type="text"
                  placeholder="e.g. CS401: Software Engineering Capstone"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />

                <label>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fall 2026 senior project laboratory"
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                />

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateClassModal(false)}
                    className="secondary-button"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" style={{ flex: 1 }}>
                    Generate & Create Class
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}



      {/* CLASS ROSTER & TEAMS MODAL (TEACHER) */}
      {selectedClassIdForRoster && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="auth-box"
            style={{ maxWidth: "680px", width: "100%", maxHeight: "85vh", overflowY: "auto", background: "#101116", border: "1px solid #282a34" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", margin: "0 0 6px" }}>
                  {classRosterData?.name || "Class Management"}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#71717a" }}>Class Code:</span>
                  <code style={{ fontSize: "13px", color: "#c084fc", fontWeight: "700", letterSpacing: "1px" }}>
                    {classRosterData?.code}
                  </code>
                  <button
                    onClick={() => handleCopyCode(classRosterData?.code)}
                    style={{
                      background: copiedCode === classRosterData?.code ? "#22c55e" : "#1f1a30",
                      color: copiedCode === classRosterData?.code ? "#000" : "#d8b4fe",
                      border: "none",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontSize: "9px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {copiedCode === classRosterData?.code ? "✓ Copied" : "📋 Copy Code"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedClassIdForRoster(null);
                  setClassRosterData(null);
                }}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {rosterLoading ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#71717a" }}>Loading roster...</div>
            ) : (
              <div>
                {/* STUDENTS ROSTER */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #1f2028", paddingBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "#e4e4e7" }}>
                      Enrolled Students ({classRosterData?.members?.filter((m) => m.class_role === "student" || m.role === "student").length || 0})
                    </h4>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {classRosterData?.members?.filter((m) => m.class_role === "student" || m.role === "student").length > 0 ? (
                      classRosterData.members
                        .filter((m) => m.class_role === "student" || m.role === "student")
                        .map((student) => (
                          <div
                            key={student.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 14px",
                              background: "#0c0d12",
                              borderRadius: "8px",
                              border: "1px solid #1f2028",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  background: "#21183a",
                                  color: "#a78bfa",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                }}
                              >
                                {student.avatar || student.name?.[0] || "S"}
                              </div>
                              <div>
                                <strong style={{ fontSize: "12px", color: "#f4f4f5", display: "block" }}>{student.name}</strong>
                                <span style={{ fontSize: "10px", color: "#71717a" }}>
                                  {student.email} · {student.rank || "Student"} · {student.xp || 0} XP
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveStudent(classRosterData.id, student.id)}
                              style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#f87171",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "10px",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))
                    ) : (
                      <div style={{ padding: "18px", textAlign: "center", color: "#71717a", fontSize: "11px", background: "#0c0d12", borderRadius: "8px", border: "1px dashed #20222a" }}>
                        No students have enrolled in this class yet. Share the join code <strong>{classRosterData?.code}</strong> with your students!
                      </div>
                    )}
                  </div>
                </div>

                {/* TEAMS */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #1f2028", paddingBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "#e4e4e7" }}>
                      Teams ({classRosterData?.teams?.length || 0})
                    </h4>
                    <button
                      className="secondary-button"
                      style={{ fontSize: "10px", padding: "4px 8px" }}
                      onClick={() => {
                        setNewTeamClassId(classRosterData.id);
                        setShowCreateTeamModal(true);
                      }}
                    >
                      + Add Team
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {classRosterData?.teams?.length > 0 ? (
                      classRosterData.teams.map((team) => (
                        <div
                          key={team.id}
                          style={{
                            padding: "12px 14px",
                            background: "#0c0d12",
                            borderRadius: "8px",
                            border: "1px solid #1f2028",
                          }}
                        >
                          <strong style={{ fontSize: "13px", color: "#f4f4f5", display: "block", marginBottom: "4px" }}>
                            {team.name}
                          </strong>
                          <span style={{ fontSize: "10px", color: "#71717a", display: "block" }}>
                            Leader: {team.leader_name || "Unassigned"}
                          </span>
                          <span style={{ fontSize: "10px", color: "#a1a1aa", display: "block", marginTop: "4px" }}>
                            {team.member_count || 0} members · {team.project_count || 0} projects
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: "1 / -1", padding: "18px", textAlign: "center", color: "#71717a", fontSize: "11px", background: "#0c0d12", borderRadius: "8px", border: "1px dashed #20222a" }}>
                        No teams created in this class yet.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "24px", textAlign: "right" }}>
                  <button
                    onClick={() => {
                      setSelectedClassIdForRoster(null);
                      setClassRosterData(null);
                    }}
                    className="secondary-button"
                    style={{ padding: "8px 16px" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 120,
            padding: "20px",
          }}
        >
          <div
            className="auth-box"
            style={{ maxWidth: "440px", background: "#101116", border: "1px solid #282a34" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0 }}>Create New Team</h2>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {teamCreateError && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "11px" }}>
                {teamCreateError}
              </div>
            )}

            <form onSubmit={handleCreateTeam}>
              <label>Team Name</label>
              <input
                type="text"
                placeholder="e.g. Team Phoenix"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />

              <label>Assign to Class</label>
              <select
                value={newTeamClassId}
                onChange={(e) => setNewTeamClassId(e.target.value)}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 13px",
                  marginBottom: "19px",
                  border: "1px solid #2b2e38",
                  borderRadius: "7px",
                  background: "#0b0c10",
                  color: "#eeeeef",
                  fontSize: "12px",
                }}
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ flex: 1 }}>
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;