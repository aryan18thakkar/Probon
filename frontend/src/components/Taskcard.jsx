function Taskcard({ task, onStatusChange, onSubmitEvidence }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#eab308";
      default:
        return "#6b7280";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return { bg: "rgba(34, 197, 94, 0.15)", border: "#193524", text: "#86efac" };
      case "Verification Pending":
        return { bg: "rgba(234, 179, 8, 0.15)", border: "#4a3c10", text: "#fde047" };
      case "In Progress":
        return { bg: "rgba(59, 130, 246, 0.15)", border: "#1e293b", text: "#93c5fd" };
      default:
        return { bg: "rgba(107, 114, 128, 0.15)", border: "#252832", text: "#9ca3af" };
    }
  };

  const statusBadge = getStatusBadge(task.status);

  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "9px",
        background: "#0d0e13",
        border: "1px solid #252832",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "8px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              background: "rgba(255,255,255,0.05)",
              color: getPriorityColor(task.priority),
              border: `1px solid ${getPriorityColor(task.priority)}40`,
            }}
          >
            {task.priority}
          </span>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "8px",
              color: "#858894",
              background: "#13141a",
              border: "1px solid #20222a",
              textTransform: "capitalize",
            }}
          >
            {task.task_type}
          </span>
        </div>

        <span
          style={{
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "9px",
            fontWeight: "600",
            background: statusBadge.bg,
            border: `1px solid ${statusBadge.border}`,
            color: statusBadge.text,
          }}
        >
          {task.status}
        </span>
      </div>

      <div>
        <h4 style={{ margin: "0 0 6px", fontSize: "14px", color: "#f3f4f6" }}>{task.title}</h4>
        {task.description && (
          <p style={{ margin: 0, fontSize: "11px", color: "#71717a", lineHeight: "1.5" }}>
            {task.description}
          </p>
        )}
      </div>

      {task.completion_evidence && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: "6px",
            background: "#13141b",
            border: "1px solid #20222b",
            fontSize: "10px",
            color: "#a1a1aa",
          }}
        >
          <strong style={{ color: "#a78bfa", display: "block", marginBottom: "2px" }}>
            Evidence:
          </strong>
          {task.completion_evidence}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "10px",
          borderTop: "1px solid #1f2028",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#21183a",
              color: "#a78bfa",
              fontSize: "8px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {task.assigned_to_avatar || "U"}
          </div>
          <span style={{ fontSize: "10px", color: "#858894" }}>
            {task.assigned_to_name || "Unassigned"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {task.status === "Planned" && onStatusChange && (
            <button
              onClick={() => onStatusChange(task.id, "In Progress")}
              className="secondary-button"
              style={{ padding: "5px 9px", fontSize: "9px" }}
            >
              Start Task →
            </button>
          )}

          {task.status === "In Progress" && onSubmitEvidence && (
            <button
              onClick={() => onSubmitEvidence(task)}
              className="primary-button"
              style={{ padding: "5px 9px", fontSize: "9px" }}
            >
              Submit Evidence
            </button>
          )}

          {task.status === "Verification Pending" && onStatusChange && (
            <button
              onClick={() => onStatusChange(task.id, "Completed")}
              className="primary-button"
              style={{ padding: "5px 9px", fontSize: "9px", background: "#16a34a" }}
            >
              Mark Completed ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Taskcard;
