import { useNavigate } from "react-router-dom";

function Projectcard({ project }) {
  const navigate = useNavigate();

  const initials = project.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
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

      {project.tags && project.tags.length > 0 && (
        <div className="project-tags">
          {project.tags.map((tag, idx) => (
            <span key={idx}>{tag}</span>
          ))}
        </div>
      )}

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
}

export default Projectcard;
