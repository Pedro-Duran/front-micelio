import React, { useEffect, useState, useRef, useCallback } from "react";
import { parsePage } from "../../utils/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const MIN_WIDTH = 140;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 200;

function SubjectsSidebar() {
  const [subjects, setSubjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? Number(saved) : DEFAULT_WIDTH;
  });
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const pathMatch = location.pathname.match(/^\/subject\/(.+)$/);
  const activeSubject = pathMatch ? decodeURIComponent(pathMatch[1]) : null;

  useEffect(() => {
    fetch("/api/posts/verPosts")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((raw) => parsePage(raw).content)
      .then((data) => {
        const counts = {};
        data.forEach((post) => {
          const subjs = Array.isArray(post.subjects) && post.subjects.length > 0
            ? post.subjects
            : post.subject ? [post.subject] : [t("sidebar.noCategory")];
          subjs.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
        });
        setSubjects(Object.entries(counts).map(([name, count]) => ({ name, count })));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + e.clientX - startX.current));
      setWidth(next);
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setWidth((w) => { localStorage.setItem("sidebarWidth", String(w)); return w; });
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
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
        width: `${width}px`,
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
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 16px" }}>
        {t("sidebar.categories")}
      </p>
      <button
        onClick={() => navigate("/")}
        style={btnStyle(location.pathname === "/")}
      >
        {t("sidebar.all")}
      </button>
      {subjects.map(({ name }) => (
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
        </button>
      ))}

      {/* drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "5px",
          height: "100%",
          cursor: "col-resize",
          zIndex: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,195,247,0.15)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      />
    </aside>
  );
}

export default SubjectsSidebar;
