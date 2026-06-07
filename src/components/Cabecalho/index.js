import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Cabecalho = () => {
  const { isLoggedIn, username, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [search, setSearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [activeCategory, setActiveCategory] = useState("usuarios");
  const inputRef = useRef(null);

  const handleLogout = () => { logout(); navigate("/login"); };

  const categories = [
    { type: "usuarios", label: "Usuários" },
    { type: "posts", label: "Posts" },
    { type: "subjects", label: "Subjects" },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    setSearch("");
    setShowCategories(false);
    if (activeCategory === "usuarios") navigate(q ? `/users?q=${encodeURIComponent(q)}` : "/users");
    else navigate(`/search?q=${encodeURIComponent(q)}&type=${activeCategory}`);
  };

  const selectCategory = (type) => {
    setActiveCategory(type);
    inputRef.current?.focus();
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
        {isLoggedIn && <li><Link to="/novoPost" style={linkStyle}>Novo post</Link></li>}
        {isLoggedIn && <li><Link to="/feed" style={linkStyle}>Feed</Link></li>}
        {!isHome && <li><Link to="/" style={linkStyle}>Posts</Link></li>}
        <li><Link to="/dashboard" style={linkStyle}>Analytics</Link></li>

        {/* Search */}
        <li style={{ position: "relative" }}>
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #333",
              borderRadius: showCategories ? "4px 4px 0 0" : "4px",
              overflow: "hidden",
              background: "#161616",
            }}
          >
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowCategories(true)}
              onBlur={() => setTimeout(() => setShowCategories(false), 150)}
              placeholder="Buscar..."
              style={{
                background: "transparent",
                border: "none",
                padding: "5px 10px",
                color: "#ccc",
                fontSize: "13px",
                width: "160px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{ background: "transparent", border: "none", padding: "5px 9px", color: "#444", cursor: "pointer", display: "flex", alignItems: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; }}
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="6.5" cy="6.5" r="4" />
                <line x1="9.5" y1="9.5" x2="13" y2="13" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          {showCategories && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "100%",
                background: "#161616",
                border: "1px solid #333",
                borderTop: "none",
                borderRadius: "0 0 6px 6px",
                display: "flex",
                overflow: "hidden",
              }}
            >
              {categories.map(({ type, label }) => {
                const active = activeCategory === type;
                return (
                  <button
                    key={type}
                    onMouseDown={(e) => { e.preventDefault(); selectCategory(type); }}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      borderTop: active ? "2px solid #4fc3f7" : "2px solid transparent",
                      color: active ? "#4fc3f7" : "#555",
                      padding: "6px 4px",
                      fontSize: "11px",
                      fontWeight: active ? "600" : "400",
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#888"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#555"; }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
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
          <li><Link to="/login" style={linkStyle}>Login</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default Cabecalho;
