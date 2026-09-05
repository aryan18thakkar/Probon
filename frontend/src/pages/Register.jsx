import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Register() {

  const navigate = useNavigate();

  const handleRegister = (e) => {
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
            🚀 Start building
          </div>

          <h1>
            Your next project
            <span> starts here.</span>
          </h1>

          <p>
            Create your developer profile, discover projects,
            collaborate with teams and turn your contributions
            into a reputation.
          </p>

        </div>

      </div>


      <div className="auth-right">

        <div className="auth-box">

          <h2>Create your account</h2>

          <p className="auth-subtitle">
            Join the ProjectHub developer community
          </p>

          <form onSubmit={handleRegister}>

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Aryan Thakkar"
              required
            />

            <label>
              Username
            </label>

            <input
              type="text"
              placeholder="@username"
              required
            />

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
              placeholder="Create a password"
              required
            />

            <button
              type="submit"
              className="auth-button"
            >
              Create Account →
            </button>

          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Register;