import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function SubjectsSidebar() {
  const [subjects, setSubjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const pathMatch = location.pathname.match(/^\/subject\/(.+)$/);
  const activeSubject = pathMatch ? decodeURIComponent(pathMatch[1]) : null;

  useEffect(() => {
    fetch("/api/posts/verPosts")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        const counts = {};
        data.forEach((post) => {
          const s = post.subject || "Sem categoria";
          counts[s] = (counts[s] || 0) + 1;
        });
        setSubjects(Object.entries(counts).map(([name, count]) => ({ name, count })));
      });
  }, []);

  const btnStyle = (active) => ({
    background: active ? "#1a3a4a" : "none",
    border: "none",
    borderLeft: active ? "3px solid #4fc3f7" : "3px solid transparent",
    color: active ? "#4fc3f7" : "#999",
    textAlign: "left",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "13px",
    width: "100%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

  return (
    <aside
      style={{
        width: "200px",
        flexShrink: 0,
        borderRight: "1px solid #2a2a2a",
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        position: "sticky",
        top: 0,
        height: "calc(100vh - 60px)",
        overflowY: "auto",
      }}
    >
      <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 16px" }}>
        Categorias
      </p>
      <button
        onClick={() => navigate("/")}
        style={btnStyle(location.pathname === "/")}
      >
        Todos
      </button>
      {subjects.map(({ name, count }) => (
        <button
          key={name}
          onClick={() => navigate(`/subject/${encodeURIComponent(name)}`)}
          style={btnStyle(activeSubject === name)}
          onMouseEnter={(e) => {
            if (activeSubject !== name) {
              e.currentTarget.style.color = "#e0e0e0";
              e.currentTarget.style.borderLeftColor = "#4fc3f7";
            }
          }}
          onMouseLeave={(e) => {
            if (activeSubject !== name) {
              e.currentTarget.style.color = "#999";
              e.currentTarget.style.borderLeftColor = "transparent";
            }
          }}
        >
          {name}
          <span style={{ float: "right", color: "#555", fontSize: "11px" }}>{count}</span>
        </button>
      ))}
    </aside>
  );
}

export default SubjectsSidebar;
