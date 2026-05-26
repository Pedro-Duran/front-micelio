import React from "react";
import { ForceGraph2D } from "react-force-graph";
import { Link, useNavigate } from "react-router-dom";

function lerpColor(t) {
  const r = Math.round(26 + t * (79 - 26));
  const g = Math.round(74 + t * (195 - 74));
  const b = Math.round(90 + t * (247 - 90));
  return `rgb(${r},${g},${b})`;
}

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

function SubjectCard({ subject, nodes, links, onNodeClick, overlay = false }) {
  const navigate = useNavigate();
  const maxVc = Math.max(...nodes.map((n) => n.viewCount), 1);

  const sortedNonStub = [...nodes]
    .filter((n) => !n.isStub)
    .sort((a, b) => b.viewCount - a.viewCount);

  const topPost = sortedNonStub[0] || null;
  const topPosts = sortedNonStub.slice(0, 3);

  const previewRaw = topPost ? stripMarkdown(topPost.content) : "";
  const previewText = previewRaw.length > 120 ? previewRaw.slice(0, 120) + "…" : previewRaw;

  const paintNode = (node, ctx, globalScale) => {
    const t = node.isStub ? 0 : node.viewCount / maxVc;
    const radius = node.isStub ? 3 : 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.isStub ? "rgba(100, 150, 200, 0.3)" : lerpColor(t);
    ctx.fill();

    const opacity = Math.min(1, Math.max(0, (globalScale - 0.5) / 0.8));
    if (opacity > 0) {
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = `rgba(220, 220, 220, ${opacity})`;
      ctx.fillText(node.title, node.x, node.y + radius + 2 / globalScale);
    }
  };

  return (
    <div
      style={{
        width: "300px",
        background: "#242424",
        borderRadius: "8px",
        border: "1px solid #2e2e2e",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <h3
        onClick={() => navigate(`/subject/${encodeURIComponent(subject)}`)}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#e0e0e0"; }}
        style={{
          margin: 0,
          padding: "12px 14px 8px",
          fontSize: "13px",
          fontWeight: "bold",
          color: "#e0e0e0",
          borderBottom: "1px solid #2e2e2e",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        {subject}
        <span style={{ color: "#555", fontSize: "11px", fontWeight: "normal" }}>
          {nodes.length} post{nodes.length !== 1 ? "s" : ""}
        </span>
      </h3>

      {/* Graph — with overlay variant */}
      <div style={{ background: "#1e1e1e", position: "relative" }}>
        <ForceGraph2D
          graphData={{ nodes, links }}
          nodeLabel="title"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          linkColor={() => "rgba(22, 157, 211, 0.4)"}
          width={300}
          height={overlay ? 220 : 180}
          onNodeClick={onNodeClick}
          backgroundColor="#1e1e1e"
        />

        {overlay && topPost && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(to bottom, transparent 0%, rgba(18,18,18,0.88) 38%, rgba(18,18,18,0.97) 62%)",
              padding: "36px 16px 16px",
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <p style={{ color: "#4fc3f7", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
                Neste tópico
              </p>
              <h4 style={{ color: "#e8e8e8", fontSize: "13px", margin: "0 0 5px", fontWeight: "bold", lineHeight: "1.3" }}>
                {topPost.title}
              </h4>
              {previewText && (
                <p style={{ color: "#888", fontSize: "11px", lineHeight: "1.5", margin: "0 0 8px" }}>
                  {previewText}
                </p>
              )}
              <Link
                to={`/post/${topPost.id}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#81d4fa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
                style={{ color: "#4fc3f7", fontSize: "12px", textDecoration: "none", fontWeight: "500" }}
              >
                Ler mais →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Post list — only in non-overlay mode */}
      {!overlay && topPosts.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: "8px 0", display: "flex", flexDirection: "column", gap: "2px" }}>
          {topPosts.map((post, i) => (
            <li key={post.id}>
              <button
                onClick={() => onNodeClick(post)}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#2e2e2e"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 14px",
                  gap: "8px",
                  textAlign: "left",
                }}
              >
                <span style={{ color: "#3a3a3a", fontSize: "11px", width: "14px", flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ color: "#ccc", fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.title}
                </span>
                {post.viewCount > 0 && (
                  <span style={{ color: "#4fc3f7", fontSize: "11px", flexShrink: 0 }}>{post.viewCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SubjectCard;
