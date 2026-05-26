import React from "react";
import { Link, useNavigate } from "react-router-dom";

function stripMarkdown(text) {
  return (text || "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*|__|\*|_/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function PostCard({ post }) {
  const navigate = useNavigate();
  const preview = stripMarkdown(post.content);
  const excerpt = preview.length > 220 ? preview.slice(0, 220) + "…" : preview;

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3e3e3e"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2e2e2e"; }}
      style={{
        background: "#242424",
        border: "1px solid #2e2e2e",
        borderRadius: "8px",
        padding: "18px 22px",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            to={`/user/${post.authorUsername}`}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#81d4fa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
            style={{ color: "#4fc3f7", fontSize: "13px", textDecoration: "none", fontWeight: "500" }}
          >
            {post.authorUsername}
          </Link>
          {post.subject && (
            <Link
              to={`/subject/${encodeURIComponent(post.subject)}`}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#555"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#333"; }}
              style={{ color: "#555", fontSize: "11px", textDecoration: "none", border: "1px solid #333", borderRadius: "3px", padding: "1px 6px" }}
            >
              {post.subject}
            </Link>
          )}
        </div>
        <span style={{ color: "#444", fontSize: "11px" }}>{timeAgo(post.createdAt)}</span>
      </div>
      <h3 style={{ color: "#e0e0e0", fontSize: "15px", margin: "0 0 6px", fontWeight: "600", lineHeight: "1.4" }}>
        {post.title}
      </h3>
      {excerpt && (
        <p style={{ color: "#777", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
          {excerpt}
        </p>
      )}
    </div>
  );
}

export default PostCard;
