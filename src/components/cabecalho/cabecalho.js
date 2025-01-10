import React from "react";

const Cabecalho = () => {
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
      {/* Links de Navegação */}
      <ul
        style={{
          display: "flex",
          listStyle: "none",
          gap: "15px",
          margin: 0,
          padding: 0,
        }}
      >
        <li>
          <a
            href="/novoPost"
            style={{
              textDecoration: "none",
              color: "white",
              fontWeight: "500",
            }}
          >
            Novo post
          </a>
        </li>
        <li>
          <a
            href="/about"
            style={{
              textDecoration: "none",
              color: "white",
              fontWeight: "500",
            }}
          >
            Sobre
          </a>
        </li>
        <li>
          <a
            href="/posts"
            style={{
              textDecoration: "none",
              color: "white",
              fontWeight: "500",
            }}
          >
            Posts
          </a>
        </li>
        <li>
          <a
            href="/contact"
            style={{
              textDecoration: "none",
              color: "white",
              fontWeight: "500",
            }}
          >
            Login
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Cabecalho;
