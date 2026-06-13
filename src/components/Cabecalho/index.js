import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

const Cabecalho = () => {
  const { isLoggedIn, username, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [search, setSearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [activeCategory, setActiveCategory] = useState("usuarios");
  const [lang, setLang] = useState(i18n.language);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const inputRef = useRef(null);
  const userMenuRef = useRef(null);

  const handleLogout = () => { logout(); navigate("/login"); };

  const toggleLang = () => {
    const next = lang === "pt-BR" ? "en" : "pt-BR";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
    setLang(next);
  };

  const categories = [
    { type: "usuarios", label: t("nav.users") },
    { type: "posts", label: t("nav.posts") },
    { type: "subjects", label: t("nav.subjects") },
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
        {t("nav.brand")}
      </Link>

      <ul style={{ display: "flex", listStyle: "none", gap: "15px", margin: 0, padding: 0, alignItems: "center" }}>
        {isLoggedIn && <li><Link to="/novoPost" style={linkStyle}>{t("nav.newPost")}</Link></li>}
        {isLoggedIn && <li><Link to="/feed" style={linkStyle}>{t("nav.feed")}</Link></li>}
        {!isHome && <li><Link to="/" style={linkStyle}>{t("nav.posts")}</Link></li>}
        <li><Link to="/dashboard" style={linkStyle}>{t("nav.analytics")}</Link></li>

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
              placeholder={t("nav.searchPlaceholder")}
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

        {/* Language toggle */}
        <li>
          <button
            onClick={toggleLang}
            style={{
              background: "none",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "#666",
              cursor: "pointer",
              padding: "3px 8px",
              fontSize: "11px",
              letterSpacing: "0.04em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#555"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#333"; }}
          >
            {lang === "pt-BR" ? "EN" : "PT"}
          </button>
        </li>

        {isLoggedIn ? (
          <>
            <li style={{ position: "relative" }} ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                onBlur={() => setTimeout(() => setShowUserMenu(false), 150)}
                style={{ background: "none", border: "none", color: "#888", fontSize: "14px", cursor: "pointer", padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}
              >
                {username}
              </button>
              {showUserMenu && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#141414",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                  overflow: "hidden",
                  minWidth: "170px",
                  zIndex: 100,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}>
                  {[
                    { label: "Ver perfil", action: () => navigate(`/user/${username}`) },
                    { label: "Preferências de grafos", action: () => navigate("/graph-preferences") },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      onMouseDown={(e) => { e.preventDefault(); action(); setShowUserMenu(false); }}
                      style={{
                        display: "block",
                        width: "100%",
                        background: "none",
                        border: "none",
                        borderBottom: "1px solid #1e1e1e",
                        color: "#aaa",
                        fontSize: "13px",
                        padding: "10px 14px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.color = "#e0e0e0"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#aaa"; }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </li>
            <li>
              <button
                onClick={handleLogout}
                style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "4px 12px", fontSize: "13px" }}
              >
                {t("nav.logout")}
              </button>
            </li>
          </>
        ) : (
          <li><Link to="/login" style={linkStyle}>{t("nav.login")}</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default Cabecalho;
