import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { authFetch } from "../../utils/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePosts } from "../../context/PostsContext";
import { useTranslation } from "react-i18next";

const MIN_WIDTH = 140;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 200;

function SubjectsSidebar() {
  const { posts } = usePosts();
  const [pinnedSubjects, setPinnedSubjects] = useState([]);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
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

  const subjects = useMemo(() => {
    const counts = {};
    posts.forEach((post) => {
      const subjs = Array.isArray(post.subjects) && post.subjects.length > 0
        ? post.subjects
        : post.subject ? [post.subject] : [t("sidebar.noCategory")];
      subjs.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [posts, t]);

  // Load pinned subjects
  useEffect(() => {
    if (!isLoggedIn) { setPinnedSubjects([]); return; }
    authFetch("/api/users/subjects/pinned")
      .then((r) => r.ok ? r.json() : [])
      .catch(() => [])
      .then((data) => setPinnedSubjects(Array.isArray(data) ? data : []));
  }, [isLoggedIn]);

  const pinnedSet = useMemo(() => new Set(pinnedSubjects), [pinnedSubjects]);

  const handleTogglePin = async (e, subjectName) => {
    e.stopPropagation();
    const isPinned = pinnedSet.has(subjectName);
    if (isPinned) {
      setPinnedSubjects((prev) => prev.filter((s) => s !== subjectName));
      try {
        await authFetch(`/api/users/subjects/pin/${encodeURIComponent(subjectName)}`, { method: "DELETE" });
      } catch {
        setPinnedSubjects((prev) => [...prev, subjectName]);
      }
    } else {
      setPinnedSubjects((prev) => [...prev, subjectName]);
      try {
        await authFetch("/api/users/subjects/pin", {
          method: "POST",
          body: JSON.stringify({ subjectName }),
        });
      } catch {
        setPinnedSubjects((prev) => prev.filter((s) => s !== subjectName));
      }
    }
  };

  const sortedSubjects = useMemo(() => {
    const tutorial = subjects.find((s) => s.name === "Tutorial");
    const pinned = pinnedSubjects
      .map((name) => subjects.find((s) => s.name === name))
      .filter(Boolean)
      .filter((s) => s.name !== "Tutorial");
    const rest = subjects.filter(
      (s) => s.name !== "Tutorial" && !pinnedSet.has(s.name)
    );
    return [...(tutorial ? [tutorial] : []), ...pinned, ...rest];
  }, [subjects, pinnedSubjects, pinnedSet]);

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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
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
        alignSelf: "flex-start",
        height: "calc(100vh - 60px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 16px" }}>
        {t("sidebar.categories")}
      </p>
      <button
        onClick={() => navigate("/")}
        style={{ ...btnStyle(location.pathname === "/"), justifyContent: "flex-start" }}
      >
        {t("sidebar.all")}
      </button>

      {sortedSubjects.map(({ name }) => {
        const active = activeSubject === name;
        const isPinned = pinnedSet.has(name);
        const isHovered = hoveredSubject === name;

        return (
          <div
            key={name}
            style={{ position: "relative", display: "flex", alignItems: "center" }}
            onMouseEnter={() => setHoveredSubject(name)}
            onMouseLeave={() => setHoveredSubject(null)}
          >
            <button
              onClick={() => navigate(`/subject/${encodeURIComponent(name)}`)}
              style={{
                ...btnStyle(active),
                flex: 1,
                paddingRight: isLoggedIn ? "28px" : "16px",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#e0e0e0";
                  e.currentTarget.style.borderLeftColor = "#4fc3f7";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#999";
                  e.currentTarget.style.borderLeftColor = "transparent";
                }
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </span>
            </button>

            {isLoggedIn && (isHovered || isPinned) && (
              <button
                onClick={(e) => handleTogglePin(e, name)}
                title={isPinned ? "Desafixar" : "Fixar"}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  color: isPinned ? "#4fc3f7" : "#555",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isPinned ? "#4fc3f7" : "#555"; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
                </svg>
              </button>
            )}
          </div>
        );
      })}

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
