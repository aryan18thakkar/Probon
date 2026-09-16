import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { api } from "../api/client";

function Arena() {
  const [userProjects, setUserProjects] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activeTab, setActiveTab] = useState("challenges");
  const [loading, setLoading] = useState(true);

  // Evidence submission modal
  const [completingChallenge, setCompletingChallenge] = useState(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  const loadArenaData = async () => {
    try {
      setLoading(true);
      const [projsRes, dashRes, arenaRes, leaderRes, achRes] = await Promise.allSettled([
        api.projects.getMy(),
        api.progress.getDashboard(),
        api.gamification.getArena(),
        api.gamification.getLeaderboard(10),
        api.gamification.getAchievements(),
      ]);

      if (projsRes.status === "fulfilled" && projsRes.value?.success) {
        setUserProjects(projsRes.value.data || []);
      }
      if (dashRes.status === "fulfilled" && dashRes.value?.success) {
        setDashboardData(dashRes.value.data);
      }
      if (arenaRes.status === "fulfilled" && arenaRes.value?.success) {
        setChallenges(arenaRes.value.data || []);
      }
      if (leaderRes.status === "fulfilled" && leaderRes.value?.success) {
        setLeaderboard(leaderRes.value.data || []);
      }
      if (achRes.status === "fulfilled" && achRes.value?.success) {
        setAchievements(achRes.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load arena data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArenaData();
  }, []);

  const handleAcceptChallenge = async (challengeId) => {
    try {
      const res = await api.gamification.acceptChallenge(challengeId);
      setBannerMessage(res.message || "Challenge accepted! Submit evidence once completed to earn XP.");
      loadArenaData();
      setTimeout(() => setBannerMessage(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to accept challenge.");
    }
  };

  const handleCompleteChallenge = async (e) => {
    e.preventDefault();
    if (!completingChallenge) return;
    setSubmitting(true);
    try {
      const res = await api.gamification.completeChallenge(completingChallenge.id, evidenceText);
      setBannerMessage(res.message || `Challenge completed! +${res.earnedXp} XP awarded!`);
      setCompletingChallenge(null);
      setEvidenceText("");
      loadArenaData();
      setTimeout(() => setBannerMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to complete challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar projects={userProjects} />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <span>ProjectHub</span>
            <span>›</span>
            <span>Weekly Arena</span>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <div className="welcome-label">COMPETITIVE CODE SPRINT</div>
              <h1>
                Weekly Arena <span>⚡</span>
              </h1>
              <p className="welcome-description">
                Tackle weekly software engineering challenges, submit PR/commit evidence to earn bonus XP, and climb the developer leaderboard.
              </p>
            </div>
          </section>

          {bannerMessage && (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "8px",
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid #15803d",
                color: "#4ade80",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>🎉 {bannerMessage}</span>
              <button
                onClick={() => setBannerMessage("")}
                style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontSize: "14px" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ARENA TABS */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              borderBottom: "1px solid #1f2028",
              paddingBottom: "14px",
              marginBottom: "24px",
            }}
          >
            <button
              onClick={() => setActiveTab("challenges")}
              style={{
                padding: "8px 16px",
                borderRadius: "7px",
                border: "1px solid",
                borderColor: activeTab === "challenges" ? "#3b2a5c" : "transparent",
                background: activeTab === "challenges" ? "#181326" : "transparent",
                color: activeTab === "challenges" ? "#a78bfa" : "#71717a",
                fontSize: "12px",
                fontWeight: activeTab === "challenges" ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Active Challenges ({challenges.length})
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              style={{
                padding: "8px 16px",
                borderRadius: "7px",
                border: "1px solid",
                borderColor: activeTab === "leaderboard" ? "#3b2a5c" : "transparent",
                background: activeTab === "leaderboard" ? "#181326" : "transparent",
                color: activeTab === "leaderboard" ? "#a78bfa" : "#71717a",
                fontSize: "12px",
                fontWeight: activeTab === "leaderboard" ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Live Leaderboard 🏆
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              style={{
                padding: "8px 16px",
                borderRadius: "7px",
                border: "1px solid",
                borderColor: activeTab === "achievements" ? "#3b2a5c" : "transparent",
                background: activeTab === "achievements" ? "#181326" : "transparent",
                color: activeTab === "achievements" ? "#a78bfa" : "#71717a",
                fontSize: "12px",
                fontWeight: activeTab === "achievements" ? "600" : "400",
                cursor: "pointer",
              }}
            >
              Badges & Achievements 🎖️ ({achievements.length})
            </button>
          </div>

          {activeTab === "challenges" && (
            <>
              {/* CHALLENGES GRID */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                  marginBottom: "36px",
                }}
              >
                {loading ? (
                  <div style={{ color: "#71717a", padding: "20px 0" }}>Loading challenges...</div>
                ) : challenges.length > 0 ? (
                  challenges.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "24px",
                        borderRadius: "10px",
                        background: "#0d0e13",
                        border: c.user_status === "completed" ? "1px solid #1d3c31" : (c.user_status === "accepted" ? "1px solid #3b2a5c" : "1px solid #282a34"),
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "#1c152e",
                              color: "#a78bfa",
                              fontSize: "9px",
                              fontWeight: "700",
                            }}
                          >
                            {c.tag || "Challenge"} · {c.difficulty || "Standard"}
                          </span>
                          <span style={{ color: "#f59e0b", fontSize: "12px", fontWeight: "700" }}>+{c.xp_reward} XP</span>
                        </div>
                        <h3 style={{ margin: "0 0 6px", fontSize: "15px", color: "#f4f4f5" }}>{c.title}</h3>
                        <p style={{ margin: 0, color: "#71717a", fontSize: "11px", lineHeight: "1.5" }}>
                          {c.description}
                        </p>
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        {c.user_status === "completed" ? (
                          <div
                            style={{
                              width: "100%",
                              padding: "9px",
                              borderRadius: "6px",
                              background: "rgba(34, 197, 94, 0.12)",
                              border: "1px solid #166534",
                              color: "#4ade80",
                              textAlign: "center",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            ✓ Completed (+{c.xp_reward} XP)
                          </div>
                        ) : c.user_status === "accepted" ? (
                          <button
                            className="primary-button"
                            style={{ width: "100%", fontSize: "11px", padding: "9px" }}
                            onClick={() => {
                              setCompletingChallenge(c);
                              setEvidenceText("");
                            }}
                          >
                            Submit Evidence & Claim XP →
                          </button>
                        ) : (
                          <button
                            className="secondary-button"
                            style={{ width: "100%", fontSize: "11px", padding: "9px" }}
                            onClick={() => handleAcceptChallenge(c.id)}
                          >
                            Accept Challenge →
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#71717a", padding: "20px 0" }}>No challenges available.</div>
                )}
              </div>

              {/* CONTRIBUTIONS OVERVIEW */}
              <div
                style={{
                  padding: "24px",
                  borderRadius: "10px",
                  background: "#0d0e13",
                  border: "1px solid #252832",
                }}
              >
                <h3 style={{ margin: "0 0 14px", fontSize: "16px" }}>Your Recent Contribution History</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {dashboardData?.recentActivities?.length > 0 ? (
                    dashboardData.recentActivities.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom: "1px solid #1f2028",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "12px", display: "block", color: "#e4e4e7" }}>
                            {act.description}
                          </strong>
                          <span style={{ fontSize: "9px", color: "#71717a" }}>
                            {act.project_name || "General"} · {new Date(act.recorded_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span style={{ color: "#a78bfa", fontSize: "11px", fontWeight: "700" }}>
                          +{act.xp} XP
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#666a76", fontSize: "11px", padding: "10px 0" }}>
                      No recent activities recorded yet. Complete challenges or tasks to build your activity feed!
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "leaderboard" && (
            <div
              style={{
                padding: "24px",
                borderRadius: "10px",
                background: "#0d0e13",
                border: "1px solid #252832",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>Student Developer Rankings</h3>
                  <p style={{ margin: 0, color: "#71717a", fontSize: "11px" }}>
                    Ranked by total earned XP and verified software contributions.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {leaderboard.length > 0 ? (
                  leaderboard.map((student) => {
                    const isTop3 = student.position <= 3;
                    const posColor =
                      student.position === 1 ? "#fbbf24" : student.position === 2 ? "#94a3b8" : student.position === 3 ? "#b45309" : "#71717a";

                    return (
                      <div
                        key={student.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 18px",
                          borderRadius: "8px",
                          background: isTop3 ? "#13141d" : "#0c0d12",
                          border: isTop3 ? "1px solid #2d2642" : "1px solid #1f2028",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "800", color: posColor, width: "24px", textAlign: "center" }}>
                            #{student.position}
                          </span>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "#21183a",
                              color: "#a78bfa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            {student.avatar || student.name?.[0] || "S"}
                          </div>
                          <div>
                            <strong style={{ fontSize: "13px", color: "#f4f4f5", display: "block" }}>{student.name}</strong>
                            <span style={{ fontSize: "10px", color: "#71717a" }}>
                              @{student.username} · {student.rank || "Student"} · {student.challenges_completed || 0} arena challenges completed
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#c084fc" }}>
                            {student.xp?.toLocaleString() || 0} XP
                          </span>
                          <span style={{ fontSize: "10px", color: "#71717a" }}>
                            {student.points || 0} points
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: "20px 0", color: "#71717a", textAlign: "center", fontSize: "12px" }}>
                    No leaderboard data available yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "achievements" && (
            <div
              style={{
                padding: "24px",
                borderRadius: "10px",
                background: "#0d0e13",
                border: "1px solid #252832",
              }}
            >
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>Earned Developer Badges</h3>
                <p style={{ margin: 0, color: "#71717a", fontSize: "11px" }}>
                  Milestones and merit awards earned through verified code commits, challenge completions, and community contributions.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {achievements.length > 0 ? (
                  achievements.map((ach) => (
                    <div
                      key={ach.id}
                      style={{
                        padding: "20px",
                        borderRadius: "10px",
                        background: "#111218",
                        border: "1px solid #2b253d",
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "12px",
                          background: "#1b1429",
                          border: "1px solid #3b2865",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          flexShrink: 0,
                        }}
                      >
                        {ach.badge_icon || "🎖️"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <h4 style={{ margin: 0, fontSize: "14px", color: "#f4f4f5" }}>{ach.title}</h4>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b" }}>
                            +{ach.xp_reward} XP
                          </span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#a1a1aa", lineHeight: "1.4" }}>
                          {ach.description}
                        </p>
                        <span style={{ fontSize: "9px", color: "#71717a" }}>
                          Unlocked {new Date(ach.unlocked_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "40px 0", color: "#71717a", textAlign: "center", fontSize: "12px", gridColumn: "1 / -1" }}>
                    No badges unlocked yet. Record contributions, complete tasks, or win weekly challenges to earn achievements!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* COMPLETE CHALLENGE MODAL */}
      {completingChallenge && (
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
              <h2 style={{ fontSize: "18px", margin: 0 }}>Claim Challenge XP</h2>
              <button
                onClick={() => setCompletingChallenge(null)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "#a1a1aa", fontSize: "12px", marginBottom: "12px" }}>
              Challenge: <strong style={{ color: "#f4f4f5" }}>{completingChallenge.title}</strong>
            </p>
            <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#1b1429", border: "1px solid #3b2865", color: "#c084fc", fontSize: "11px", fontWeight: "600", marginBottom: "16px" }}>
              Reward: +{completingChallenge.xp_reward} XP and Contribution Points
            </div>

            <form onSubmit={handleCompleteChallenge}>
              <label>Submission Evidence (Commit hash, PR URL, or resolution description)</label>
              <textarea
                rows="4"
                placeholder="e.g. Refactored module in PR #16 (commit 8b1f23) with unit tests passing."
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
                  onClick={() => setCompletingChallenge(null)}
                  className="secondary-button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? "Claiming..." : "Submit & Claim XP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Arena;