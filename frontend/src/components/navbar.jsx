import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Project<span>Hub</span>
      </Link>

      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#community">Community</a>
      </div>

      <div className="nav-actions">
        <Link to="/login" className="login-link">
          Log in
        </Link>

        <Link to="/register" className="nav-signup">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;