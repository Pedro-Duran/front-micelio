import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ForceGraph2D } from "react-force-graph";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";

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

const PREVIEW_LIMIT = 280;

function SubjectPage() {
  const { name } = useParams();
  const subject = decodeURIComponent(name);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [topPost, setTopPost] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  const [graphWidth, setGraphWidth] = useState(600);
  const navigate = useNavigate();

  useEffect(() => {
    setExpanded(false);
    Promise.all([
      fetch("/api/posts/verPosts").then((r) => r.json()),
      fetch("/api/events/summary").then((r) => r.json()).catch(() => []),
    ]).then(([postsData, summaryData]) => {
      const vcMap = {};
      summaryData.forEach((s) => { vcMap[s.postId] = s.viewCount || 0; });

      const subjectNodes = postsData
        .filter((p) => (p.subject || "Sem categoria") === subject)
        .map((p) => ({
          id: p.id,
          title: p.title || "Sem título",
          content: p.content || "",
          isStub: p.isStub || false,
          viewCount: vcMap[p.id] || 0,
        }));

      const subjectIds = new Set(subjectNodes.map((n) => n.id));
      const subjectLinks = [];
      postsData.forEach((p) => {
        if (Array.isArray(p.links)) {
          p.links.forEach((linkedId) => {
            if (subjectIds.has(p.id) && subjectIds.has(linkedId)) {
              subjectLinks.push({ source: p.id, target: linkedId });
            }
          });
        }
      });

      const best = [...subjectNodes]
        .filter((n) => !n.isStub)
        .sort((a, b) => b.viewCount - a.viewCount)[0] || null;

      setNodes(subjectNodes);
      setLinks(subjectLinks);
      setTopPost(best);
    }).catch((err) => console.error(err));
  }, [subject]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setGraphWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const maxVc = Math.max(...nodes.map((n) => n.viewCount), 1);
  const sortedPosts = [...nodes].filter((n) => !n.isStub).sort((a, b) => b.viewCount - a.viewCount);

  const paintNode = (node, ctx, globalScale) => {
    const t = node.isStub ? 0 : node.viewCount / maxVc;
    const radius = node.isStub ? 3 : 4 + t * 10;
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

  const previewText = topPost ? stripMarkdown(topPost.content) : "";
  const isLong = previewText.length > PREVIEW_LIMIT;
  const displayText = expanded || !isLong
    ? previewText
    : previewText.slice(0, PREVIEW_LIMIT) + "…";

  const OVERLAY_PREVIEW = 160;
  const overlayText = previewText.length > OVERLAY_PREVIEW
    ? previewText.slice(0, OVERLAY_PREVIEW) + "…"
    : previewText;

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "24px 32px 16px", borderBottom: "1px solid #2a2a2a" }}>
            <h1 style={{ color: "#e0e0e0", margin: 0, fontSize: "22px" }}>{subject}</h1>
            <p style={{ color: "#555", fontSize: "13px", margin: "4px 0 0" }}>
              {nodes.length} post{nodes.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

            {/* Card: grafo + preview */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <div
                style={{
                  background: "#1a1a1a",
                  borderRadius: "10px",
                  border: "1px solid #2e2e2e",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Grafo */}
                <div ref={containerRef}>
                  <ForceGraph2D
                    graphData={{ nodes, links }}
                    width={graphWidth}
                    height={420}
                    nodeLabel="title"
                    nodeCanvasObject={paintNode}
                    nodeCanvasObjectMode={() => "replace"}
                    linkColor={() => "rgba(22, 157, 211, 0.4)"}
                    onNodeClick={(node) => navigate(`/post/${node.id}`)}
                    backgroundColor="#1a1a1a"
                  />
                </div>

                {/* Overlay com preview */}
                {topPost && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "linear-gradient(to bottom, transparent 0%, rgba(18,18,18,0.85) 30%, rgba(18,18,18,0.97) 60%)",
                      padding: "60px 24px 22px",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ pointerEvents: "auto" }}>
                      <p style={{ color: "#4fc3f7", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 5px" }}>
                        Neste tópico
                      </p>
                      <h3 style={{ color: "#e8e8e8", fontSize: "15px", margin: "0 0 7px", fontWeight: "bold", lineHeight: "1.3" }}>
                        {topPost.title}
                      </h3>
                      <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", margin: "0 0 12px" }}>
                        {overlayText}
                      </p>
                      <Link
                        to={`/post/${topPost.id}`}
                        style={{ color: "#4fc3f7", fontSize: "13px", textDecoration: "none", fontWeight: "500" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#81d4fa"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
                      >
                        Ler mais →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de posts */}
            <div
              style={{
                width: "260px",
                flexShrink: 0,
                borderLeft: "1px solid #2a2a2a",
                overflowY: "auto",
                padding: "16px 0",
              }}
            >
              <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 16px" }}>
                Posts
              </p>
              {sortedPosts.map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#2a2a2a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "7px 16px",
                    gap: "8px",
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: "#3a3a3a", fontSize: "11px", width: "16px", flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ color: "#ccc", fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.title}
                  </span>
                  {post.viewCount > 0 && (
                    <span style={{ color: "#4fc3f7", fontSize: "11px", flexShrink: 0 }}>{post.viewCount}</span>
                  )}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default SubjectPage;
