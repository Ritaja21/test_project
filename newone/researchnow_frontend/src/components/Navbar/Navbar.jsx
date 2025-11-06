import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { assets } from "../../assets/assets"; // ✅ Fixed Import

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  const handleRoleChange = () => {
    setUserRole(localStorage.getItem("userRole"));
  };

  useEffect(() => {
    handleRoleChange(); // Initial role sync

    window.addEventListener("roleChange", handleRoleChange);
    window.addEventListener("storage", handleRoleChange); // For other tabs

    return () => {
      window.removeEventListener("roleChange", handleRoleChange);
      window.removeEventListener("storage", handleRoleChange);
    };
  }, []);
  // Determine Dashboard Route
  const getDashboardRoute = () => {
    if (userRole === "student") return "/student-dashboard";
    if (userRole === "faculty") return "/faculty-dashboard";
    return "/login"; // Default to login if no role found
  };


  const handleLogout = async () => {
    try {
      // Optional: call your backend logout API
      await fetch("http://localhost:8000/api/auth/logout", {
        method: "POST",
        // credentials: "include", // Important if using cookies
      });

      // Remove local data
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");

      // Update state instantly
      setUserRole(null);

      // Dispatch custom event to sync across tabs/components
      window.dispatchEvent(new Event("roleChange"));

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <nav className="navbar">
      {/* Logo */}
      <img
        src={assets.logo1 || ""}
        width="250"
        alt="logo"
        className="logo"
        onError={(e) => (e.target.style.display = "none")} // Hide if logo fails to load
      />

      {/* Navigation Links */}
      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
        <li><NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink></li>
        <li><NavLink to="/aboutus" onClick={() => setMenuOpen(false)}>About Us</NavLink></li>
        <li><NavLink to={getDashboardRoute()} onClick={() => setMenuOpen(false)}>Dashboard</NavLink></li>
        <li><NavLink to="/opportunities" onClick={() => setMenuOpen(false)}>Opportunities</NavLink></li>
        <li><NavLink to="/faculties" onClick={() => setMenuOpen(false)}>Faculties</NavLink></li>
        <li><NavLink to="/ongoing-projects" onClick={() => setMenuOpen(false)}>Ongoing Projects</NavLink></li>
      </ul>

      {/* Login/Signup Buttons */}
      <div className="nav-buttons">
        {!userRole ? (
          <>
            <button className="login" onClick={() => navigate("/login")}>Log in</button>
            <button className="signup" onClick={() => navigate("/signup")}>Sign up</button>
          </>
        ) : (
          <button className="logout" onClick={handleLogout}>Log out</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
