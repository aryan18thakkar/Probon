import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

              <a href="#">
                Forgot password?
              </a>

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

    </div>
  );
}

export default Login;