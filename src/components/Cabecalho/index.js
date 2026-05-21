import React from "react";
import { useAuth } from "../../context/AuthContext";

const Cabecalho = () => {
  const { isLoggedIn, username, logout } = useAuth();

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
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{"Puredo"}</div>
      <ul style={{ display: "flex", listStyle: "none", gap: "15px", margin: 0, padding: 0, alignItems: "center" }}>
        {isLoggedIn && (
          <li>
            <a href="/novoPost" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
              Novo post
            </a>
          </li>
        )}
        <li>
          <a href="/" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
            Posts
          </a>
        </li>
        <li>
          <a href="/dashboard" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
            Analytics
          </a>
        </li>
        {isLoggedIn ? (
          <>
            <li style={{ color: "#888", fontSize: "14px" }}>{username}</li>
            <li>
              <button
                onClick={logout}
                style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "4px 12px", fontSize: "13px" }}
              >
                Sair
              </button>
            </li>
          </>
        ) : (
          <li>
            <a href="/login" style={{ textDecoration: "none", color: "white", fontWeight: "500" }}>
              Login
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Cabecalho;
