import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Cabecalho = () => {
  const { isLoggedIn, username, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#1e1e1e",
        color: "#fff",
      }}
    >
      <Link
        to="/"
        style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff", textDecoration: "none" }}
      >
        Puredo
      </Link>

      <ul style={{ display: "flex", listStyle: "none", gap: "15px", margin: 0, padding: 0, alignItems: "center" }}>
        {isLoggedIn && (
          <li>
            <Link to="/novoPost" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
              Novo post
            </Link>
          </li>
        )}
        {!isHome && (
          <li>
            <Link to="/" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
              Posts
            </Link>
          </li>
        )}
        <li>
          <Link to="/dashboard" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
            Analytics
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            <li style={{ color: "#888", fontSize: "14px" }}>{username}</li>
            <li>
              <button
                onClick={handleLogout}
                style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "4px 12px", fontSize: "13px" }}
              >
                Sair
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Cabecalho;
