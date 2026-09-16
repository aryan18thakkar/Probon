import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\\/~`';]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Full name must be between 2 and 100 characters.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError("Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your password meets all complexity requirements.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: trimmedName,
        username: cleanUsername,
        email: trimmedEmail,
        password,
        role,
        classCode: classCode.trim() || undefined,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
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
            {error && (
              <div style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '7px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '11px' }}>
                {error}
              </div>
            )}

            <label>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Aryan Thakkar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label>
              Username
            </label>
            <input
              type="text"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {password.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  padding: "10px",
                  background: "#0d0e13",
                  borderRadius: "6px",
                  border: "1px solid #1f2028",
                  marginBottom: "18px",
                  fontSize: "11px",
                }}
              >
                <div style={{ color: hasMinLen ? "#4ade80" : "#71717a", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>{hasMinLen ? "✓" : "○"}</span> 8+ characters
                </div>
                <div style={{ color: hasUpper && hasLower ? "#4ade80" : "#71717a", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>{hasUpper && hasLower ? "✓" : "○"}</span> Upper & lowercase
                </div>
                <div style={{ color: hasNumber ? "#4ade80" : "#71717a", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>{hasNumber ? "✓" : "○"}</span> At least 1 number
                </div>
                <div style={{ color: hasSpecial ? "#4ade80" : "#71717a", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>{hasSpecial ? "✓" : "○"}</span> 1 special character
                </div>
              </div>
            )}

            <label>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 13px',
                marginBottom: '19px',
                border: '1px solid #2b2e38',
                borderRadius: '7px',
                outline: 'none',
                background: '#0b0c10',
                color: '#eeeeef',
                fontSize: '12px',
              }}
            >
              <option value="student">Student / Team Member</option>
              <option value="teacher">Teacher / Instructor</option>
            </select>

            {role === "student" && (
              <>
                <label>
                  Class Join Code <small style={{ color: '#71717a' }}>(optional)</small>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS401A"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                />
              </>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account →"}
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