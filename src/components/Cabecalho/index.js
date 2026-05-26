import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Cabecalho = () => {
  const { isLoggedIn, username, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/user/${encodeURIComponent(q)}` : "/users");
    setSearch("");
  };

  const linkStyle = { textDecoration: "none", color: "white", fontWeight: "500" };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#1e1e1e",
        color: "#fff",
        borderBottom: "1px solid #2a2a2a",
      }}
    >
      <Link to="/" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff", textDecoration: "none" }}>
        Puredo
      </Link>

      <ul style={{ display: "flex", listStyle: "none", gap: "15px", margin: 0, padding: 0, alignItems: "center" }}>
        {isLoggedIn && (
          <li>
            <Link to="/novoPost" style={linkStyle}>Novo post</Link>
          </li>
        )}
        {isLoggedIn && (
          <li>
            <Link to="/feed" style={linkStyle}>Feed</Link>
          </li>
        )}
        {!isHome && (
          <li>
            <Link to="/" style={linkStyle}>Posts</Link>
          </li>
        )}
        <li>
          <Link to="/dashboard" style={linkStyle}>Analytics</Link>
        </li>

        {/* User search */}
        <li>
          <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", border: "1px solid #333", borderRadius: "4px", overflow: "hidden" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuário..."
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 8px",
                color: "#ccc",
                fontSize: "13px",
                width: "130px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 8px",
                color: "#555",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#999"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="6.5" cy="6.5" r="4" />
                <line x1="9.5" y1="9.5" x2="13" y2="13" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </li>

        {isLoggedIn ? (
          <>
            <li>
              <Link
                to={`/user/${username}`}
                style={{ color: "#888", fontSize: "14px", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}
              >
                {username}
              </Link>
            </li>
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
            <Link to="/login" style={linkStyle}>Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Cabecalho;
