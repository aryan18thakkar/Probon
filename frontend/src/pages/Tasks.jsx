import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Taskcard from "../components/Taskcard";
import { api } from "../api/client";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [scope, setScope] = useState("my"); // "my" | "all"
  const [loading, setLoading] = useState(true);

  // Evidence Modal
  const [evidenceTask, setEvidenceTask] = useState(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskType, setTaskType] = useState("weekly");
  const [createError, setCreateError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, myProjsRes] = await Promise.allSettled([
        scope === "my" ? api.tasks.getMy() : api.tasks.getAll({ allAccessible: true }),
        api.projects.getMy(),
      ]);

      if (tasksRes.status === "fulfilled" && tasksRes.value?.success) {
        setTasks(tasksRes.value.data || []);
      }

      const projsList = (myProjsRes.status === "fulfilled" && myProjsRes.value?.success)
        ? (myProjsRes.value.data || [])
        : [];

      setProjects(projsList);
      if (projsList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projsList[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [scope]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.tasks.update(taskId, { status: newStatus });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to update task status.");
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
      loadData();
    } catch (err) {
      alert(err.message || "Failed to submit evidence.");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!selectedProjectId) {
      setCreateError("Please select a project.");
      return;
    }

    try {
      await api.tasks.create({
        projectId: parseInt(selectedProjectId, 10),
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        taskType: taskType,
      });

      setShowCreateModal(false);
      setTaskTitle("");
      setTaskDesc("");
      loadData();
    } catch (err) {
      setCreateError(err.message || "Failed to create task.");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "all") return true;
    return t.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="dashboard-page">
      <Sidebar projects={projects} />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <span>ProjectHub</span>
            <span>›</span>
            <span>My Tasks</span>
          </div>

          <div className="topbar-actions">
            <button
              className="create-project-button"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Task
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section" style={{ marginBottom: "24px" }}>
            <div>
              <div className="welcome-label">TASK MANAGEMENT</div>
              <h1>
                Your Tasks <span>✓</span>
              </h1>
              <p className="welcome-description">
                Track your active assignments, daily goals, and submit completion evidence for verification.
              </p>
            </div>
          </section>

          {/* SCOPE TOGGLE (MY TASKS vs ALL PROJECT TASKS) */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button
              onClick={() => setScope("my")}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: scope === "my" ? "1px solid #a855f7" : "1px solid #27272a",
                background: scope === "my" ? "#2a1548" : "#12131a",
                color: scope === "my" ? "#d8b4fe" : "#a1a1aa",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              👤 My Tasks
            </button>
            <button
              onClick={() => setScope("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: scope === "all" ? "1px solid #a855f7" : "1px solid #27272a",
                background: scope === "all" ? "#2a1548" : "#12131a",
                color: scope === "all" ? "#d8b4fe" : "#a1a1aa",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              🌐 All Project Tasks
            </button>
          </div>

          {/* STATUS TABS */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              borderBottom: "1px solid #1f2028",
              paddingBottom: "14px",
              marginBottom: "24px",
              overflowX: "auto",
            }}
          >
            {[
              { id: "all", label: `All Tasks (${tasks.length})` },
              { id: "Planned", label: `Planned (${tasks.filter((t) => t.status === "Planned").length})` },
              { id: "In Progress", label: `In Progress (${tasks.filter((t) => t.status === "In Progress").length})` },
              {
                id: "Verification Pending",
                label: `Verification Pending (${tasks.filter((t) => t.status === "Verification Pending").length})`,
              },
              { id: "Completed", label: `Completed (${tasks.filter((t) => t.status === "Completed").length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "7px",
                  border: "1px solid",
                  borderColor: activeTab === tab.id ? "#3b2a5c" : "transparent",
                  background: activeTab === tab.id ? "#181326" : "transparent",
                  color: activeTab === tab.id ? "#a78bfa" : "#71717a",
                  fontSize: "11px",
                  fontWeight: activeTab === tab.id ? "600" : "400",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TASK GRID */}
          {loading ? (
            <div style={{ color: "#71717a", padding: "30px 0" }}>Loading tasks...</div>
          ) : filteredTasks.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "14px",
              }}
            >
              {filteredTasks.map((task) => (
                <Taskcard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onSubmitEvidence={handleOpenEvidence}
                />
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
              No tasks found in this view.
            </div>
          )}
        </div>
      </main>

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
          <div
            className="auth-box"
            style={{ maxWidth: "460px", background: "#101116", border: "1px solid #282a34" }}
          >
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
                placeholder="e.g. Implemented auth middleware and verified tests. Merged via PR #14 (commit 7a9bf4)."
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

      {/* CREATE TASK MODAL */}
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
            style={{ maxWidth: "460px", background: "#101116", border: "1px solid #282a34" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Create New Task</h2>
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

            <form onSubmit={handleCreateTask}>
              <label>Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
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
                required
              >
                <option value="">-- Select a Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.team_name ? `(${p.team_name})` : ""}
                  </option>
                ))}
              </select>

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
                placeholder="Short description or acceptance criteria"
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
                  <label>Cadence</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
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
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;