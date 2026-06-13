import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ForceGraph2D } from "react-force-graph";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import { authFetch, parsePage } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { getSavedPreset } from "../../utils/graphPresets";

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

function SubjectPage() {
  const { name } = useParams();
  const subject = decodeURIComponent(name);
  const graphPhysics = getSavedPreset();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [topPost, setTopPost] = useState(null);
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [graphWidth, setGraphWidth] = useState(600);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(subject);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [headerHover, setHeaderHover] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!fgRef.current || nodes.length === 0) return;
    const p = getSavedPreset();
    fgRef.current.d3Force("charge").strength(p.charge);
    fgRef.current.d3Force("link")?.distance(p.linkDistance);
    if (p.linkStrength !== undefined) fgRef.current.d3Force("link")?.strength(p.linkStrength);
    fgRef.current.d3ReheatSimulation();
  }, [nodes]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === subject) { setEditingName(false); return; }
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/posts/subjects/${encodeURIComponent(subject)}`, {
        method: "PUT",
        body: JSON.stringify({ newName: trimmed }),
      });
      if (!res.ok) throw new Error();
      navigate(`/subject/${encodeURIComponent(trimmed)}`, { replace: true });
    } catch {
      alert(t("subjectPage.renameError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/posts/subjects/${encodeURIComponent(subject)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      navigate("/", { replace: true });
    } catch {
      alert(t("subjectPage.deleteError"));
    } finally {
      setActionLoading(false);
      setDeleteConfirm(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/posts/verPosts").then((r) => r.json()).then((d) => parsePage(d).content),
      authFetch("/api/events/summary").then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([postsData, summaryData]) => {
      const vcMap = {};
      summaryData.forEach((s) => { vcMap[s.postId] = s.viewCount || 0; });

      const getSubjs = (p) =>
        Array.isArray(p.subjects) && p.subjects.length > 0
          ? p.subjects
          : p.subject ? [p.subject] : [t("sidebar.noCategory")];

      const writtenTitles = new Set(
        postsData.filter((p) => !p.isStub).map((p) => p.title?.toLowerCase().trim()).filter(Boolean)
      );
      const dedupedPosts = postsData.filter(
        (p) => !p.isStub || !writtenTitles.has(p.title?.toLowerCase().trim())
      );

      const subjectNodes = dedupedPosts
        .filter((p) => getSubjs(p).includes(subject))
        .map((p) => ({
          id: p.id,
          title: p.title || t("sidebar.noCategory"),
          content: p.content || "",
          isStub: p.isStub || false,
          viewCount: vcMap[p.id] || 0,
        }));

      const subjectIds = new Set(subjectNodes.map((n) => n.id));
      const subjectLinks = [];
      dedupedPosts.forEach((p) => {
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
  }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const tv = node.isStub ? 0 : node.viewCount / maxVc;
    const radius = node.isStub ? 3 : 4 + tv * 10;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.isStub ? "rgba(100, 150, 200, 0.3)" : lerpColor(tv);
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
  const overlayText = previewText.length > 160
    ? previewText.slice(0, 160) + "…"
    : previewText;

  return (
    <>
      <Cabecalho />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#242424", border: "1px solid #3a3a3a", borderRadius: "8px", padding: "28px 32px", width: "380px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "16px" }}>{t("subjectPage.deleteConfirmTitle")}</h3>
            <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              {t("subjectPage.deleteConfirmMsg", { subject })}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "8px 18px", fontSize: "13px" }}
              >
                {t("subjectPage.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                style={{ background: "#c62828", border: "none", borderRadius: "4px", color: "#fff", cursor: actionLoading ? "default" : "pointer", padding: "8px 18px", fontSize: "13px", fontWeight: "bold" }}
              >
                {actionLoading ? "..." : t("subjectPage.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          <div style={{ padding: "24px 32px 16px", borderBottom: "1px solid #2a2a2a" }}>
            {editingName ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingName(false); }}
                  autoFocus
                  style={{ background: "transparent", border: "none", borderBottom: "1px solid #4fc3f7", color: "#e0e0e0", fontSize: "22px", fontWeight: "bold", padding: "0 2px 2px", outline: "none", minWidth: "200px" }}
                />
                <button onClick={handleRename} disabled={actionLoading} style={{ background: "none", border: "none", color: "#4fc3f7", cursor: "pointer", padding: "0 2px", fontSize: "13px", opacity: actionLoading ? 0.5 : 1 }}>
                  {actionLoading ? "…" : t("subjectPage.saveRename")}
                </button>
                <button onClick={() => { setEditingName(false); setNewName(subject); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "0 2px", fontSize: "13px" }}>
                  {t("subjectPage.cancelRename")}
                </button>
              </div>
            ) : (
              <div
                onMouseEnter={() => setHeaderHover(true)}
                onMouseLeave={() => setHeaderHover(false)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <h1 style={{ color: "#e0e0e0", margin: 0, fontSize: "22px", fontWeight: "600" }}>{subject}</h1>

                {/* Share — visible to all */}
                <button
                  onClick={handleShare}
                  title={copied ? t("share.copied") : t("share.copyLink")}
                  style={{ background: "none", border: "none", color: copied ? "#4fc3f7" : "#555", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", opacity: headerHover || copied ? 1 : 0, transition: "opacity 0.15s, color 0.15s", borderRadius: "4px" }}
                  onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = "#4fc3f7"; }}
                  onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = "#555"; }}
                >
                  {copied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                </button>

                {isLoggedIn && (
                  <>
                    {/* Edit */}
                    <button
                      onClick={() => { setNewName(subject); setEditingName(true); }}
                      title={t("common.edit")}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", opacity: headerHover ? 1 : 0, transition: "opacity 0.15s, color 0.15s", borderRadius: "4px" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      title={t("common.delete")}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", opacity: headerHover ? 1 : 0, transition: "opacity 0.15s, color 0.15s", borderRadius: "4px" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#ef5350"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
            <p style={{ color: "#555", fontSize: "13px", margin: "4px 0 0" }}>
              {t("subjectPage.post", { count: nodes.length })}
            </p>
          </div>

          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

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
                <div ref={containerRef}>
                  <ForceGraph2D
                    ref={fgRef}
                    graphData={{ nodes, links }}
                    width={graphWidth}
                    height={280}
                    pixelRatio={window.devicePixelRatio}
                    nodeLabel="title"
                    nodeCanvasObject={paintNode}
                    nodeCanvasObjectMode={() => "replace"}
                    linkColor={() => "rgba(22, 157, 211, 0.4)"}
                    onNodeClick={(node) => navigate(`/post/${node.id}`)}
                    backgroundColor="#1a1a1a"
                    onEngineStop={() => {}}
                    d3AlphaDecay={graphPhysics.d3AlphaDecay}
                    d3VelocityDecay={graphPhysics.d3VelocityDecay}
                    minZoom={graphPhysics.minZoom}
                    warmupTicks={graphPhysics.warmupTicks}
                    cooldownTicks={graphPhysics.cooldownTicks}
                  />
                </div>

                {topPost && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "linear-gradient(to bottom, transparent 0%, rgba(18,18,18,0.88) 40%, rgba(18,18,18,0.97) 65%)",
                      padding: "40px 24px 20px",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ pointerEvents: "auto" }}>
                      <p style={{ color: "#4fc3f7", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 5px" }}>
                        {t("subjectPage.inThisTopic")}
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
                        {t("common.readMore")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                {t("subjectPage.posts")}
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
