import { Link } from "react-router-dom";
import Navbar from "../components/navbar";

function Landing() {
  return (
    <div className="landing-page">

      <Navbar />

      <main>

        {/* HERO */}

        <section className="hero">

          <div className="hero-content">

            <div className="hero-badge">
              🚀 The collaborative space for developers
            </div>

            <h1>
              Build ideas.
              <br />
              <span>Build together.</span>
            </h1>

            <p>
              ProjectHub is a collaborative platform where developers
              can share project ideas, find teammates, contribute to
              real projects, and grow their developer reputation.
            </p>

            <div className="hero-buttons">

              <Link to="/register" className="primary-button">
                Start Building →
              </Link>

              <Link to="/login" className="secondary-button">
                Explore Platform
              </Link>

            </div>

            <div className="hero-stats">

              <div>
                <strong>1K+</strong>
                <span>Developers</span>
              </div>

              <div>
                <strong>500+</strong>
                <span>Projects</span>
              </div>

              <div>
                <strong>2K+</strong>
                <span>Contributions</span>
              </div>

            </div>

          </div>


          {/* HERO PROJECT PREVIEW */}

          <div className="hero-preview">

            <div className="preview-window">

              <div className="window-header">
                <div className="window-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="window-title">
                  projecthub / ai-interviewer
                </div>
              </div>

              <div className="preview-body">

                <div className="preview-sidebar">

                  <div className="preview-logo">
                    PH
                  </div>

                  <div className="preview-nav active">
                    ◈
                  </div>

                  <div className="preview-nav">
                    ◇
                  </div>

                  <div className="preview-nav">
                    ✓
                  </div>

                  <div className="preview-nav">
                    ⚡
                  </div>

                </div>

                <div className="preview-main">

                  <div className="preview-top">
                    <div>
                      <small>PROJECT</small>
                      <h3>AI Interview Platform</h3>
                    </div>

                    <span className="live-badge">
                      ● ACTIVE
                    </span>
                  </div>

                  <p className="preview-description">
                    AI-powered technical interview platform
                    for developers and recruiters.
                  </p>

                  <div className="preview-tags">
                    <span>React</span>
                    <span>Node.js</span>
                    <span>MongoDB</span>
                    <span>AI/ML</span>
                  </div>

                  <div className="preview-progress">

                    <div className="progress-header">
                      <span>Project Progress</span>
                      <strong>72%</strong>
                    </div>

                    <div className="progress-bar">
                      <div></div>
                    </div>

                  </div>

                  <div className="preview-bottom">

                    <div className="avatars">
                      <span>AT</span>
                      <span>RK</span>
                      <span>PS</span>
                      <span>+3</span>
                    </div>

                    <div className="preview-xp">
                      ⚡ 1,240 XP
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* FEATURES */}

        <section className="features-section" id="features">

          <div className="section-label">
            WHY PROJECTHUB
          </div>

          <h2>
            Everything you need to
            <span> build together.</span>
          </h2>

          <p className="section-description">
            From finding projects to earning recognition,
            ProjectHub brings the complete developer collaboration
            experience into one platform.
          </p>

          <div className="features-grid">

            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Share Ideas</h3>
              <p>
                Publish your project ideas and discover developers
                who want to build them with you.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Collaborate</h3>
              <p>
                Create teams, assign tasks and work together
                on real software projects.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Earn Recognition</h3>
              <p>
                Earn XP, contribution points and badges as
                you make meaningful contributions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Assisted</h3>
              <p>
                Get intelligent project recommendations,
                developer matching and AI-powered assistance.
              </p>
            </div>

          </div>

        </section>


        {/* HOW IT WORKS */}

        <section className="how-section" id="how-it-works">

          <div className="section-label">
            HOW IT WORKS
          </div>

          <h2>
            From idea to
            <span> contribution.</span>
          </h2>

          <div className="steps">

            <div className="step">
              <div className="step-number">01</div>

              <h3>Discover</h3>

              <p>
                Explore software projects that match
                your interests and skills.
              </p>
            </div>

            <div className="step">
              <div className="step-number">02</div>

              <h3>Join</h3>

              <p>
                Connect with project owners and become
                part of a development team.
              </p>
            </div>

            <div className="step">
              <div className="step-number">03</div>

              <h3>Contribute</h3>

              <p>
                Complete tasks, fix issues and contribute
                code to real projects.
              </p>
            </div>

            <div className="step">
              <div className="step-number">04</div>

              <h3>Grow</h3>

              <p>
                Build your contribution history, earn XP
                and strengthen your developer profile.
              </p>
            </div>

          </div>

        </section>


        {/* COMMUNITY */}

        <section className="community-section" id="community">

          <div className="community-card">

            <div>
              <div className="section-label">
                YOUR DEVELOPER JOURNEY
              </div>

              <h2>
                Your contributions
                <br />
                <span>should matter.</span>
              </h2>

              <p>
                ProjectHub turns your project contributions
                into a visible developer reputation.
              </p>

              <Link to="/register" className="primary-button">
                Create Your Profile →
              </Link>
            </div>

            <div className="reputation-card">

              <div className="profile-mini">
                <div className="profile-avatar">
                  AT
                </div>

                <div>
                  <strong>Developer Profile</strong>
                  <span>Full Stack • AI/ML</span>
                </div>
              </div>

              <div className="reputation-stats">

                <div>
                  <strong>2,450</strong>
                  <span>XP</span>
                </div>

                <div>
                  <strong>1,820</strong>
                  <span>Contribution</span>
                </div>

                <div>
                  <strong>8</strong>
                  <span>Projects</span>
                </div>

              </div>

              <div className="badges">
                <span>🐛 Bug Hunter</span>
                <span>🔧 Builder</span>
                <span>🤝 Team Player</span>
              </div>

            </div>

          </div>

        </section>

      </main>


      <footer>
        <div className="logo">
          Project<span>Hub</span>
        </div>

        <p>
          Build together. Contribute. Grow.
        </p>

        <span>
          © 2026 ProjectHub
        </span>
      </footer>

    </div>
  );
}

export default Landing;