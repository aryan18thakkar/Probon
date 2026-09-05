import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    navigate("/dashboard");
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

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="••••••••"
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
            >
              Sign In →
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