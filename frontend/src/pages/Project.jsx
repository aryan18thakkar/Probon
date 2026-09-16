import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Taskcard from "../components/Taskcard";
import { api } from "../api/client";

function Project() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoToken, setRepoToken] = useState("");
  const [repoBranch, setRepoBranch] = useState("main");
  const [repoSyncing, setRepoSyncing] = useState(false);
  const [repoMsg, setRepoMsg] = useState("");
  const [githubTab, setGithubTab] = useState("commits"); // commits, prs, issues
  const [repoCommits, setRepoCommits] = useState([]);
  const [repoPulls, setRepoPulls] = useState([]);
  const [repoIssues, setRepoIssues] = useState([]);
  const [repoStatus, setRepoStatus] = useState(null);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneXp, setMilestoneXp] = useState("100");

  // Create Task Modal on Project Page
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskMilestoneId, setTaskMilestoneId] = useState("");
  const [taskError, setTaskError] = useState("");

  // Submit Evidence Modal
  const [evidenceTask, setEvidenceTask] = useState(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      // Fetch project details first
      const projRes = await api.projects.getById(id);
      if (projRes.success && projRes.data) {
        setProject(projRes.data);
      } else {
        setProject(null);
      }
    } catch (err) {
      console.error("Failed to load project:", err);
      setProject(null);
    } finally {
      setLoading(false);
    }

    // Load auxiliary tasks, activities, and sidebar projects without blocking or failing project display
    try {
      const [tasksRes, actRes, myProjsRes, commitsRes, prsRes, issuesRes, statusRes] = await Promise.allSettled([
        api.tasks.getAll({ projectId: id }),
        api.github.getActivities(id, 10),
        api.projects.getMy(),
        api.github.getCommits(id, 20),
        api.github.getPullRequests(id, 20),
        api.github.getIssues(id, 20),
        api.github.getStatus(id),
      ]);

      if (tasksRes.status === "fulfilled" && tasksRes.value?.success) {
        setTasks(tasksRes.value.data || []);
      }
      if (actRes.status === "fulfilled" && actRes.value?.success) {
        setActivities(actRes.value.data || []);
      }
      if (myProjsRes.status === "fulfilled" && myProjsRes.value?.success) {
        setUserProjects(myProjsRes.value.data || []);
      }
      if (commitsRes.status === "fulfilled" && commitsRes.value?.success) {
        setRepoCommits(commitsRes.value.data || []);
      }
      if (prsRes.status === "fulfilled" && prsRes.value?.success) {
        setRepoPulls(prsRes.value.data || []);
      }
      if (issuesRes.status === "fulfilled" && issuesRes.value?.success) {
        setRepoIssues(issuesRes.value.data || []);
      }
      if (statusRes.status === "fulfilled" && statusRes.value?.success) {
        setRepoStatus(statusRes.value.data || null);
      }
    } catch (auxErr) {
      console.warn("Error fetching auxiliary project details:", auxErr);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const handleConnectRepo = async (e) => {
    e.preventDefault();
    setRepoMsg("");

    try {
      await api.github.connect(id, repoUrl, repoToken || undefined, repoBranch || undefined);
      setShowRepoModal(false);
      setRepoUrl("");
      setRepoToken("");
      setRepoBranch("main");
      loadProjectData();
    } catch (err) {
      setRepoMsg(err.message || "Failed to link repository.");
    }
  };

  const handleSyncRepo = async () => {
    setRepoSyncing(true);
    try {
      const res = await api.github.sync(id);
      alert(res.message || "Repository synchronized!");
      loadProjectData();
    } catch (err) {
      alert("Failed to sync repository.");
    } finally {
      setRepoSyncing(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await api.projects.addMilestone(id, {
        title: milestoneTitle,
        description: milestoneDesc,
        xpReward: parseInt(milestoneXp, 10) || 100,
      });
      setShowMilestoneModal(false);
      setMilestoneTitle("");
      setMilestoneDesc("");
      loadProjectData();
    } catch (err) {
      alert(err.message || "Failed to add milestone.");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError("");
    try {
      await api.tasks.create({
        projectId: parseInt(id, 10),
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        milestoneId: taskMilestoneId ? parseInt(taskMilestoneId, 10) : undefined,
      });
      setShowTaskModal(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskMilestoneId("");
      loadProjectData();
    } catch (err) {
      setTaskError(err.message || "Failed to create task.");
    }
  };

  const handleOpenEvidence = (task) => {
    setEvidenceTask(task);
    setEvidenceText("");
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceTask) return;
    setSubmittingEvidence(true);
    try {
      await api.tasks.submitEvidence(evidenceTask.id, evidenceText);
      setEvidenceTask(null);
      loadProjectData();
    } catch (err) {
      alert(err.message || "Failed to submit evidence.");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.tasks.update(taskId, { status: newStatus });
      loadProjectData();
    } catch (err) {
      alert(err.message || "Failed to update task.");
    }
  };

  const handleConfirmVerification = async (taskId, approved) => {
    try {
      await api.tasks.confirmVerification(taskId, approved);
      loadProjectData();
    } catch (err) {
      alert(err.message || "Failed to confirm verification.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Sidebar projects={userProjects} />
        <main className="dashboard-main" style={{ padding: "40px", color: "#71717a" }}>
          Loading project details...
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="dashboard-page">
        <Sidebar projects={userProjects} />
        <main className="dashboard-main" style={{ padding: "40px" }}>
          <h2>Project not found</h2>
          <button className="primary-button" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

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
            <span>Projects</span>
            <span>›</span>
            <span>{project.name}</span>
          </div>

          <div className="topbar-actions">
            <button
              className="primary-button"
              style={{ fontSize: "11px", padding: "8px 12px" }}
              onClick={() => navigate("/chat")}
            >
              💬 Project Chat
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* PROJECT HEADER */}
          <div
            style={{
              padding: "28px",
              borderRadius: "12px",
              background: "#0d0e13",
              border: "1px solid #252832",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    color: "#8b5cf6",
                    fontSize: "9px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {project.class_name} · {project.team_name}
                </span>
                <h1 style={{ fontSize: "28px", margin: "8px 0 10px", letterSpacing: "-0.5px" }}>
                  {project.name}
                </h1>
                <p style={{ color: "#71717a", fontSize: "12px", margin: 0, maxWidth: "680px" }}>
                  {project.description}
                </p>
              </div>

              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "9px",
                  fontWeight: "700",
                  background: "#101a16",
                  color: "#34d399",
                  border: "1px solid #1d3c31",
                }}
              >
                ● {project.status?.toUpperCase()}
              </span>
            </div>

            {/* PROGRESS BAR */}
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "8px" }}>
                <span style={{ color: "#71717a" }}>Overall Progress</span>
                <strong style={{ color: "#a78bfa" }}>{project.progress || 0}% Completed</strong>
              </div>
              <div style={{ height: "6px", borderRadius: "10px", background: "#20222a", overflow: "hidden" }}>
                <div style={{ width: `${project.progress || 0}%`, height: "100%", background: "#8b5cf6" }} />
              </div>
            </div>

            {/* TAGS */}
            {project.tags && project.tags.length > 0 && (
              <div style={{ display: "flex", gap: "6px", marginTop: "18px", flexWrap: "wrap" }}>
                {project.tags.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: "#13141a",
                      border: "1px solid #282a34",
                      color: "#8b8f9b",
                      fontSize: "9px",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "24px" }}>
            {/* LEFT: TASKS & MILESTONES */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Project Tasks ({tasks.length})</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="primary-button"
                    style={{ fontSize: "10px", padding: "6px 10px" }}
                  >
                    + Add Task
                  </button>
                  <button
                    onClick={() => navigate("/tasks")}
                    className="secondary-button"
                    style={{ fontSize: "10px", padding: "6px 10px" }}
                  >
                    Manage in Tasks →
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <Taskcard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onSubmitEvidence={handleOpenEvidence}
                      onConfirmVerification={handleConfirmVerification}
                    />
                  ))
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#666a76", fontSize: "11px", background: "#0d0e13", borderRadius: "8px", border: "1px dashed #20222a" }}>
                    No tasks created for this project yet.
                  </div>
                )}
              </div>

              {/* MILESTONES */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Milestones ({project.milestones?.length || 0})</h3>
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="secondary-button"
                  style={{ fontSize: "10px", padding: "6px 10px" }}
                >
                  + Add Milestone
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {project.milestones && project.milestones.length > 0 ? (
                  project.milestones.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: "14px 18px",
                        borderRadius: "8px",
                        background: "#0d0e13",
                        border: "1px solid #20222a",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "13px", display: "block", color: "#e4e4e7" }}>
                          {m.title}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#71717a" }}>
                          {m.description || "No description"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ color: "#f59e0b", fontSize: "10px", fontWeight: "700" }}>
                          +{m.xp_reward} XP
                        </span>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "8px",
                            fontWeight: "600",
                            background: m.status === "completed" ? "rgba(34,197,94,0.15)" : "#181820",
                            color: m.status === "completed" ? "#86efac" : "#a1a1aa",
                            border: "1px solid #282a34",
                          }}
                        >
                          {m.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#666a76", fontSize: "11px", background: "#0d0e13", borderRadius: "8px", border: "1px dashed #20222a" }}>
                    No milestones defined yet.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: REPO & TEAM MEMBERS */}
            <div>
              {/* GITHUB REPO CARD */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  background: "#0d0e13",
                  border: "1px solid #252832",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px" }}>GitHub Repository</h4>
                  {project.repository ? (
                    <button
                      onClick={handleSyncRepo}
                      className="secondary-button"
                      style={{ fontSize: "9px", padding: "4px 8px" }}
                      disabled={repoSyncing}
                    >
                      {repoSyncing ? "Syncing..." : "↻ Sync Now"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowRepoModal(true)}
                      className="primary-button"
                      style={{ fontSize: "9px", padding: "4px 8px" }}
                    >
                      Connect Repo
                    </button>
                  )}
                </div>

                {project.repository ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <a
                        href={project.repository.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#a78bfa",
                          fontSize: "12px",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        {project.repository.owner} / {project.repository.repo_name} ↗
                      </a>
                      <span
                        style={{
                          fontSize: "8px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: project.repository.sync_status === "failed" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.15)",
                          color: project.repository.sync_status === "failed" ? "#f87171" : "#4ade80",
                          border: `1px solid ${project.repository.sync_status === "failed" ? "#7f1d1d" : "#14532d"}`,
                        }}
                      >
                        ● {project.repository.sync_status === "synced" ? "Synced" : project.repository.sync_status === "syncing" ? "Syncing" : project.repository.sync_status === "failed" ? "Error" : "Linked"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#71717a", marginTop: "2px" }}>
                      <span>Branch: <code style={{ color: "#c4b5fd" }}>{project.repository.default_branch}</code></span>
                      <span>Last synced: {project.repository.last_synced_at ? new Date(project.repository.last_synced_at).toLocaleTimeString() : "Never"}</span>
                    </div>

                    {/* METRICS & TAB SWITCHER */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginTop: "14px", marginBottom: "12px" }}>
                      <button
                        type="button"
                        onClick={() => setGithubTab("commits")}
                        style={{
                          background: githubTab === "commits" ? "#1e1b4b" : "#13141a",
                          border: `1px solid ${githubTab === "commits" ? "#6366f1" : "#282a34"}`,
                          borderRadius: "6px",
                          padding: "8px 6px",
                          color: githubTab === "commits" ? "#e0e7ff" : "#8b8f9b",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: "700" }}>{repoStatus?.metrics?.commits ?? repoCommits.length}</div>
                        <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Commits</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGithubTab("prs")}
                        style={{
                          background: githubTab === "prs" ? "#1e1b4b" : "#13141a",
                          border: `1px solid ${githubTab === "prs" ? "#6366f1" : "#282a34"}`,
                          borderRadius: "6px",
                          padding: "8px 6px",
                          color: githubTab === "prs" ? "#e0e7ff" : "#8b8f9b",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: "700" }}>{repoStatus?.metrics?.pullRequests ?? repoPulls.length}</div>
                        <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pull Requests</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGithubTab("issues")}
                        style={{
                          background: githubTab === "issues" ? "#1e1b4b" : "#13141a",
                          border: `1px solid ${githubTab === "issues" ? "#6366f1" : "#282a34"}`,
                          borderRadius: "6px",
                          padding: "8px 6px",
                          color: githubTab === "issues" ? "#e0e7ff" : "#8b8f9b",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: "700" }}>{repoStatus?.metrics?.issues ?? repoIssues.length}</div>
                        <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Issues</div>
                      </button>
                    </div>

                    {/* TAB CONTENT LIST */}
                    <div style={{ borderTop: "1px solid #1f2028", paddingTop: "10px", maxHeight: "200px", overflowY: "auto" }}>
                      {githubTab === "commits" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {repoCommits.length > 0 ? (
                            repoCommits.map((c) => (
                              <div key={c.id} style={{ fontSize: "10px", background: "#111218", padding: "6px 8px", borderRadius: "4px", border: "1px solid #1b1d24" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                                  <span style={{ color: "#e4e4e7", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                    {c.title}
                                  </span>
                                  <code style={{ fontSize: "8px", color: "#a78bfa", background: "#1f1d2b", padding: "1px 4px", borderRadius: "2px" }}>
                                    {c.commit_hash ? c.commit_hash.substring(0, 7) : "commit"}
                                  </code>
                                </div>
                                <div style={{ fontSize: "8px", color: "#71717a", marginTop: "3px" }}>
                                  by <strong style={{ color: "#a1a1aa" }}>{c.matched_user_name || c.author_username}</strong> · {new Date(c.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: "10px", color: "#52525b" }}>No commits synced yet. Click "Sync Now" to fetch.</span>
                          )}
                        </div>
                      )}

                      {githubTab === "prs" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {repoPulls.length > 0 ? (
                            repoPulls.map((p) => (
                              <div key={p.id} style={{ fontSize: "10px", background: "#111218", padding: "6px 8px", borderRadius: "4px", border: "1px solid #1b1d24" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                                  <span style={{ color: "#e4e4e7", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                    #{p.pr_number} {p.title}
                                  </span>
                                  <span style={{ fontSize: "8px", color: "#a78bfa" }}>
                                    {p.branch || "main"}
                                  </span>
                                </div>
                                <div style={{ fontSize: "8px", color: "#71717a", marginTop: "3px" }}>
                                  opened by <strong style={{ color: "#a1a1aa" }}>{p.matched_user_name || p.author_username}</strong> · {new Date(p.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: "10px", color: "#52525b" }}>No pull requests synced yet.</span>
                          )}
                        </div>
                      )}

                      {githubTab === "issues" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {repoIssues.length > 0 ? (
                            repoIssues.map((iss) => (
                              <div key={iss.id} style={{ fontSize: "10px", background: "#111218", padding: "6px 8px", borderRadius: "4px", border: "1px solid #1b1d24" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                                  <span style={{ color: "#e4e4e7", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                    #{iss.pr_number || "issue"} {iss.title}
                                  </span>
                                </div>
                                <div style={{ fontSize: "8px", color: "#71717a", marginTop: "3px" }}>
                                  reported by <strong style={{ color: "#a1a1aa" }}>{iss.matched_user_name || iss.author_username}</strong> · {new Date(iss.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: "10px", color: "#52525b" }}>No issues synced yet.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#71717a", fontSize: "11px", margin: 0 }}>
                    Link a GitHub repository to track commits, PRs, and team contributions.
                  </p>
                )}
              </div>

              {/* TEAM MEMBERS */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  background: "#0d0e13",
                  border: "1px solid #252832",
                }}
              >
                <h4 style={{ margin: "0 0 14px", fontSize: "14px" }}>
                  Team Members ({project.members?.length || 0})
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {project.members?.map((m) => (
                    <div
                      key={m.id}
                      style={{ display: "flex", alignItems: "center", gap: "10px" }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#21183a",
                          color: "#a78bfa",
                          fontSize: "10px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {m.avatar || "U"}
                      </div>
                      <div>
                        <strong style={{ fontSize: "12px", display: "block", color: "#e4e4e7" }}>
                          {m.name}
                        </strong>
                        <span style={{ fontSize: "9px", color: "#71717a" }}>
                          {m.team_role?.toUpperCase()} · {m.xp || 0} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CONNECT REPO MODAL */}
      {showRepoModal && (
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
          <div className="auth-box" style={{ maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Connect GitHub Repository</h2>
              <button
                onClick={() => setShowRepoModal(false)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {repoMsg && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: "11px" }}>
                {repoMsg}
              </div>
            )}

            <form onSubmit={handleConnectRepo}>
              <label>GitHub Repository URL *</label>
              <input
                type="text"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
              />

              <label style={{ marginTop: "12px", display: "block" }}>Default Branch</label>
              <input
                type="text"
                placeholder="main"
                value={repoBranch}
                onChange={(e) => setRepoBranch(e.target.value)}
              />

              <label style={{ marginTop: "12px", display: "block" }}>
                GitHub Personal Access Token (Optional)
                <span style={{ fontSize: "9px", color: "#71717a", fontWeight: "normal", marginLeft: "6px" }}>
                  (Enables private repos & avoids API rate limits)
                </span>
              </label>
              <input
                type="password"
                placeholder="ghp_..."
                value={repoToken}
                onChange={(e) => setRepoToken(e.target.value)}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowRepoModal(false)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ flex: 1 }}>
                  Link Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MILESTONE MODAL */}
      {showMilestoneModal && (
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
          <div className="auth-box" style={{ maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Add Project Milestone</h2>
              <button
                onClick={() => setShowMilestoneModal(false)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone}>
              <label>Milestone Title</label>
              <input
                type="text"
                placeholder="e.g. Milestone 2: User Onboarding & Auth"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                required
              />

              <label>Description</label>
              <input
                type="text"
                placeholder="Key deliverables and acceptance goals"
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
              />

              <label>XP Bonus Reward</label>
              <input
                type="number"
                value={milestoneXp}
                onChange={(e) => setMilestoneXp(e.target.value)}
                min="50"
                step="50"
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ flex: 1 }}>
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
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
          <div className="auth-box" style={{ maxWidth: "460px", background: "#101116", border: "1px solid #282a34" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Create Task for {project.name}</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {taskError && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "11px" }}>
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTask}>
              <label>Task Title</label>
              <input
                type="text"
                placeholder="e.g. Build interview evaluation module"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />

              <label>Description</label>
              <input
                type="text"
                placeholder="Acceptance criteria or implementation details"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 13px",
                      marginBottom: "16px",
                      border: "1px solid #2b2e38",
                      borderRadius: "7px",
                      background: "#0b0c10",
                      color: "#eeeeef",
                      fontSize: "12px",
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label>Milestone (Optional)</label>
                  <select
                    value={taskMilestoneId}
                    onChange={(e) => setTaskMilestoneId(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 13px",
                      marginBottom: "16px",
                      border: "1px solid #2b2e38",
                      borderRadius: "7px",
                      background: "#0b0c10",
                      color: "#eeeeef",
                      fontSize: "12px",
                    }}
                  >
                    <option value="">General (No Milestone)</option>
                    {project.milestones?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ flex: 1 }}>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT EVIDENCE MODAL */}
      {evidenceTask && (
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
          <div className="auth-box" style={{ maxWidth: "460px", background: "#101116", border: "1px solid #282a34" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Submit Task Evidence</h2>
              <button
                onClick={() => setEvidenceTask(null)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "#a1a1aa", fontSize: "11px", marginBottom: "16px" }}>
              Task: <strong>{evidenceTask.title}</strong>
            </p>

            <form onSubmit={handleSubmitEvidence}>
              <label>Evidence Description or PR/Commit Link</label>
              <textarea
                rows="4"
                placeholder="e.g. Implemented feature and verified unit tests. Linked to PR #14."
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "7px",
                  border: "1px solid #2b2e38",
                  background: "#0b0c10",
                  color: "#eeeeef",
                  fontSize: "12px",
                  marginBottom: "16px",
                  fontFamily: "inherit",
                }}
                required
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEvidenceTask(null)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ flex: 1 }}
                  disabled={submittingEvidence}
                >
                  {submittingEvidence ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Project;