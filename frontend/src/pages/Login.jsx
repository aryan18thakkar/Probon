import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMsg("");
    setResetLoading(true);

    try {
      const res = await api.auth.forgotPassword(resetEmail.trim().toLowerCase());
      setForgotMsg(res.message || "Reset token generated.");
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setResetStep(2);
    } catch (err) {
      setForgotError(err.message || "Failed to request password reset.");
    } finally {
      setResetLoading(false);
    }
  };

  const handlePerformReset = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMsg("");
    setResetLoading(true);

    try {
      const res = await api.auth.resetPassword({
        token: resetToken.trim(),
        newPassword,
      });
      setForgotMsg(res.message || "Password reset successfully.");
      setEmail(resetEmail);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotMsg("");
      }, 1500);
    } catch (err) {
      setForgotError(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-left">

        <Link to="/" className="logo">
          Project<span>Hub</span>
        </Link>

        <div className="auth-message">

          <div className="hero-badge">
            👋 Welcome back
          </div>

          <h1>
            Continue building
            <span> something great.</span>
          </h1>

          <p>
            Sign in to continue collaborating with developers,
            manage your projects and keep building your reputation.
          </p>

        </div>

      </div>


      <div className="auth-right">

        <div className="auth-box">

          <h2>Welcome back</h2>

          <p className="auth-subtitle">
            Sign in to your ProjectHub account
          </p>

          <form onSubmit={handleLogin}>
            {error && (
              <div style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '7px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '11px' }}>
                {error}
              </div>
            )}

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="form-options">

              <label className="checkbox-label">
                <input type="checkbox" />
                Remember me
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotError("");
                  setForgotMsg("");
                  setResetStep(1);
                }}
                style={{ background: "none", border: "none", color: "#a78bfa", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
              >
                Forgot password?
              </button>

            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>

          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button className="github-button">
            <span>◉</span>
            Continue with GitHub
          </button>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">
              Create one
            </Link>
          </p>

        </div>

      </div>

      {/* FORGOT & RESET PASSWORD MODAL */}
      {showForgotModal && (
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
            style={{ maxWidth: "420px", width: "100%", background: "#101116", border: "1px solid #282a34" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>
                {resetStep === 1 ? "Reset Your Password" : "Enter New Password"}
              </h2>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: "none", border: "none", color: "#858995", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "11px" }}>
                {forgotError}
              </div>
            )}

            {forgotMsg && (
              <div style={{ padding: "10px", marginBottom: "14px", borderRadius: "6px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", fontSize: "11px" }}>
                {forgotMsg}
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestReset}>
                <p style={{ color: "#a1a1aa", fontSize: "12px", marginBottom: "16px" }}>
                  Enter your registered account email. We will generate secure password reset instructions for your account.
                </p>

                <label>Registered Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="secondary-button"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    style={{ flex: 1 }}
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Sending..." : "Continue"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePerformReset}>
                <p style={{ color: "#a1a1aa", fontSize: "12px", marginBottom: "16px" }}>
                  Enter the verification token sent to your email and your new password.
                </p>

                <label>Reset Token</label>
                <input
                  type="text"
                  placeholder="Paste 64-character token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />

                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 chars, Aa1!"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="secondary-button"
                    style={{ flex: 1 }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    style={{ flex: 1 }}
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Updating..." : "Save Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;