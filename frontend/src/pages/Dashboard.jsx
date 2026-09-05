import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          Project<span>Hub</span>
        </div>

        <nav className="dashboard-nav">

          <div className="dashboard-nav-title">
            WORKSPACE
          </div>

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

          <button className="dashboard-nav-item">
            <span className="dashboard-nav-icon">✓</span>
            <span>My Tasks</span>
          </button>

          {/* GROUP CHAT */}
          <button
            className="dashboard-nav-item"
            onClick={() => navigate("/chat")}
          >
            <span className="dashboard-nav-icon">💬</span>
            <span>Group Chat</span>
          </button>

          <button className="dashboard-nav-item">
            <span className="dashboard-nav-icon">⚡</span>
            <span>Weekly Arena</span>
          </button>

          <div className="dashboard-nav-title">
            YOUR PROJECTS
          </div>

          <button className="dashboard-nav-item">
            <span className="dashboard-nav-icon">AI</span>
            <span>AI Interview Platform</span>
          </button>

          <button className="dashboard-nav-item">
            <span className="dashboard-nav-icon">SC</span>
            <span>Smart Campus</span>
          </button>

        </nav>

        <div className="dashboard-sidebar-bottom">

          <div className="user-mini">

            <div className="user-avatar">
              AT
            </div>

            <div className="user-mini-info">
              <strong>Aryan</strong>
              <span>Level 6 · 2,450 XP</span>
            </div>

          </div>

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

            <button className="topbar-button">
              🔔
            </button>

            <button className="topbar-button">
              ⚙
            </button>

            <div className="topbar-profile">
              <div className="topbar-avatar">
                AT
              </div>
            </div>

          </div>

        </header>


        {/* CONTENT */}
        <div className="dashboard-content">

          {/* WELCOME */}
          <section className="welcome-section">

            <div>

              <div className="welcome-label">
                FRIDAY, AUGUST 21
              </div>

              <h1>
                Welcome back, Aryan <span>👋</span>
              </h1>

              <p className="welcome-description">
                Here's what's happening with your projects.
              </p>

            </div>

            <button
              className="create-project-button"
              onClick={() => navigate("/projects/create")}
            >
              + Create Project
            </button>

          </section>


          {/* STATS */}
          <section className="stats-grid">

            <div className="stat-card">

              <div className="stat-top">
                <span className="stat-icon">⚡</span>
                <span className="stat-change">+180 this week</span>
              </div>

              <h3 className="stat-value">
                2,450
              </h3>

              <div className="stat-label">
                Total XP
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <span className="stat-icon">🏆</span>
                <span className="stat-change">+12%</span>
              </div>

              <h3 className="stat-value">
                1,820
              </h3>

              <div className="stat-label">
                Contribution Points
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <span className="stat-icon">◇</span>
                <span className="stat-change">3 active</span>
              </div>

              <h3 className="stat-value">
                8
              </h3>

              <div className="stat-label">
                Projects
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <span className="stat-icon">↗</span>
                <span className="stat-change">Top 10%</span>
              </div>

              <h3 className="stat-value">
                #42
              </h3>

              <div className="stat-label">
                Community Rank
              </div>

            </div>

          </section>


          {/* PROJECTS */}
          <section className="dashboard-section">

            <div className="section-header-dashboard">

              <div>

                <h2>
                  Your Projects
                </h2>

                <p>
                  Projects you're currently working on.
                </p>

              </div>

              <span className="view-all">
                View all →
              </span>

            </div>


            <div className="project-grid">

              {/* PROJECT 1 */}
              <div className="dashboard-project-card">

                <div className="project-card-top">

                  <div className="project-card-icon">
                    AI
                  </div>

                  <div className="project-status">
                    <span className="project-status-dot"></span>
                    ACTIVE
                  </div>

                </div>

                <h3>
                  AI Interview Platform
                </h3>

                <p>
                  AI-powered technical interview platform
                  for developers and recruiters.
                </p>

                <div className="project-tags">
                  <span>React</span>
                  <span>Node.js</span>
                  <span>MongoDB</span>
                  <span>AI/ML</span>
                </div>

                <div className="project-progress">

                  <div className="project-progress-header">
                    <span>Project Progress</span>
                    <strong>72%</strong>
                  </div>

                  <div className="project-progress-bar">
                    <div style={{ width: "72%" }}></div>
                  </div>

                </div>

              </div>


              {/* PROJECT 2 */}
              <div className="dashboard-project-card">

                <div className="project-card-top">

                  <div className="project-card-icon">
                    SC
                  </div>

                  <div className="project-status">
                    <span className="project-status-dot"></span>
                    ACTIVE
                  </div>

                </div>

                <h3>
                  Smart Campus
                </h3>

                <p>
                  A collaborative platform for managing
                  campus services and student communities.
                </p>

                <div className="project-tags">
                  <span>React</span>
                  <span>Node.js</span>
                  <span>MongoDB</span>
                  <span>API</span>
                </div>

                <div className="project-progress">

                  <div className="project-progress-header">
                    <span>Project Progress</span>
                    <strong>48%</strong>
                  </div>

                  <div className="project-progress-bar">
                    <div style={{ width: "48%" }}></div>
                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* LOWER SECTION */}
          <div className="dashboard-lower-grid">

            {/* WEEKLY ARENA */}
            <section className="arena-card">

              <div className="arena-header">

                <div>

                  <div className="arena-label">
                    WEEKLY ARENA
                  </div>

                  <h3>
                    Code. Solve. Contribute.
                  </h3>

                  <p>
                    Complete this week's challenges to
                    earn double XP and contribution points.
                  </p>

                </div>

                <div className="arena-xp">
                  2× XP
                </div>

              </div>


              <div className="arena-task-list">

                <div className="arena-task">

                  <strong>
                    Fix a project issue
                  </strong>

                  <span>
                    Debug and submit a solution
                  </span>

                  <span className="arena-task-xp">
                    +200 XP
                  </span>

                </div>


                <div className="arena-task">

                  <strong>
                    Improve existing code
                  </strong>

                  <span>
                    Refactor a project component
                  </span>

                  <span className="arena-task-xp">
                    +150 XP
                  </span>

                </div>


                <div className="arena-task">

                  <strong>
                    Help another developer
                  </strong>

                  <span>
                    Review or contribute to a project
                  </span>

                  <span className="arena-task-xp">
                    +250 XP
                  </span>

                </div>


                <div className="arena-task">

                  <strong>
                    Solve the weekly challenge
                  </strong>

                  <span>
                    Complete the community challenge
                  </span>

                  <span className="arena-task-xp">
                    +300 XP
                  </span>

                </div>

              </div>

            </section>


            {/* ACTIVITY */}
            <section className="activity-card">

              <h3>
                Recent Activity
              </h3>

              <div className="activity-list">

                <div className="activity-item">

                  <div className="activity-icon">
                    ✓
                  </div>

                  <div className="activity-info">

                    <strong>
                      Completed authentication module
                    </strong>

                    <span>
                      AI Interview Platform · 2 hours ago
                    </span>

                  </div>

                </div>


                <div className="activity-item">

                  <div className="activity-icon">
                    +
                  </div>

                  <div className="activity-info">

                    <strong>
                      Contributed to Smart Campus
                    </strong>

                    <span>
                      +120 contribution points · Yesterday
                    </span>

                  </div>

                </div>


                <div className="activity-item">

                  <div className="activity-icon">
                    ⚡
                  </div>

                  <div className="activity-info">

                    <strong>
                      Earned Weekly Arena XP
                    </strong>

                    <span>
                      +200 XP · 2 days ago
                    </span>

                  </div>

                </div>

              </div>

            </section>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;