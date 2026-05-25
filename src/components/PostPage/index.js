import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ForceGraph2D } from "react-force-graph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MDEditor from "@uiw/react-md-editor";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import { registerEvent } from "../../utils/analytics";
import { authFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const TL_SPEEDS = { Devagar: 1500, Normal: 800, "Rápido": 300 };

function PostPage() {
  const { id } = useParams();
  const postId = parseInt(id);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [allNodes, setAllNodes] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [post, setPost] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sidebar: "graph" | "timeline"
  const [sidebarMode, setSidebarMode] = useState("graph");
  const [tlIndex, setTlIndex] = useState(0);
  const [tlRunning, setTlRunning] = useState(false);
  const [tlDone, setTlDone] = useState(false);
  const [tlData, setTlData] = useState({ nodes: [], links: [] });
  const [tlSpeed, setTlSpeed] = useState("Normal");

  const sidebarRef = useRef();
  const recorderRef = useRef();
  const chunksRef = useRef([]);

  // VIEW analytics
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      registerEvent({ postId, eventType: "VIEW", duration });
    };
  }, [postId]);

  useEffect(() => {
    fetch("/api/posts/verPosts")
      .then((res) => {
        if (!res.ok) throw new Error("Erro na requisição");
        return res.json();
      })
      .then((data) => {
        const nodes = data.map((p) => ({
          id: p.id,
          title: p.title || "Sem título",
          content: p.content || "",
          author: p.authorUsername || "Desconhecido",
          subject: p.subject || "Sem categoria",
          isStub: p.isStub || false,
          createdAt: p.createdAt || null,
        }));

        const links = [];
        data.forEach((p) => {
          if (Array.isArray(p.links)) {
            p.links.forEach((linkedId) => {
              links.push({ source: p.id, target: linkedId });
            });
          }
        });

        setAllNodes(nodes);
        setAllLinks(links);

        const current = nodes.find((n) => n.id === postId);
        if (current) {
          setPost(current);
          setEditedTitle(current.title);
          setEditedContent(current.content);
        }
      })
      .catch((err) => console.error(err));
  }, [postId]);

  const backlinks = useMemo(() => {
    return allLinks
      .filter((link) => {
        const tgt = typeof link.target === "object" ? link.target.id : link.target;
        return tgt === postId;
      })
      .map((link) => {
        const srcId = typeof link.source === "object" ? link.source.id : link.source;
        return allNodes.find((n) => n.id === srcId);
      })
      .filter(Boolean);
  }, [allLinks, allNodes, postId]);

  const localGraphData = useMemo(() => {
    if (!post) return { nodes: [], links: [] };

    const neighborIds = new Set([postId]);
    allLinks.forEach((link) => {
      const src = typeof link.source === "object" ? link.source.id : link.source;
      const tgt = typeof link.target === "object" ? link.target.id : link.target;
      if (src === postId) neighborIds.add(tgt);
      if (tgt === postId) neighborIds.add(src);
    });

    const localNodes = allNodes.filter((n) => neighborIds.has(n.id));
    const localLinks = allLinks
      .filter((link) => {
        const src = typeof link.source === "object" ? link.source.id : link.source;
        const tgt = typeof link.target === "object" ? link.target.id : link.target;
        return neighborIds.has(src) && neighborIds.has(tgt);
      })
      .map((link) => ({
        source: typeof link.source === "object" ? link.source.id : link.source,
        target: typeof link.target === "object" ? link.target.id : link.target,
      }));

    return { nodes: localNodes, links: localLinks };
  }, [post, postId, allNodes, allLinks]);

  // Nós da timeline ordenados por data
  const timelineNodes = useMemo(
    () =>
      [...localGraphData.nodes].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      ),
    [localGraphData.nodes]
  );

  // Loop de animação da timeline
  useEffect(() => {
    if (!tlRunning) return;

    if (tlIndex >= timelineNodes.length) {
      setTlRunning(false);
      setTlDone(true);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      return;
    }

    const timer = setTimeout(() => {
      const node = timelineNodes[tlIndex];
      setTlData((prev) => {
        const existingIds = new Set(prev.nodes.map((n) => n.id));
        const newLinks = localGraphData.links
          .filter((l) => {
            const src = typeof l.source === "object" ? l.source.id : l.source;
            const tgt = typeof l.target === "object" ? l.target.id : l.target;
            return (
              (src === node.id && existingIds.has(tgt)) ||
              (tgt === node.id && existingIds.has(src))
            );
          })
          .map((l) => ({
            source: typeof l.source === "object" ? l.source.id : l.source,
            target: typeof l.target === "object" ? l.target.id : l.target,
          }));
        return {
          nodes: [...prev.nodes, { ...node, fresh: true }],
          links: [...prev.links, ...newLinks],
        };
      });
      setTlIndex((i) => i + 1);
    }, TL_SPEEDS[tlSpeed]);

    return () => clearTimeout(timer);
  }, [tlRunning, tlIndex, timelineNodes, localGraphData.links, tlSpeed]);

  const resetTimeline = () => {
    setTlData({ nodes: [], links: [] });
    setTlIndex(0);
    setTlDone(false);
  };

  const openTimeline = () => {
    resetTimeline();
    setSidebarMode("timeline");
  };

  const handleRecord = () => {
    const canvas = sidebarRef.current?.querySelector("canvas");
    if (!canvas) return;

    resetTimeline();
    chunksRef.current = [];

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${post.title}-timeline.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorderRef.current = recorder;
    recorder.start();
    setTlRunning(true);
  };

  const handleSave = async () => {
    const body = {
      id: postId,
      title: editedTitle,
      content: editedContent,
      links: [],
      subject: post.subject,
    };

    try {
      setIsSaving(true);
      const response = await authFetch("/api/posts/updatePost", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Falha ao salvar");
      const updated = await response.json();
      setPost((prev) => ({ ...prev, title: updated.title, content: updated.content }));
      setEditedTitle(updated.title);
      setEditedContent(updated.content);
      setEditMode(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar o post.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Deletar "${post.title}"? Essa ação não pode ser desfeita.`)) return;
    try {
      const response = await authFetch(`/api/posts/deletePost?id=${postId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Falha ao deletar");
      navigate("/");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao deletar o post.");
    }
  };

  if (!post) {
    return (
      <>
        <Cabecalho />
        <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
          <SubjectsSidebar />
          <div style={{ color: "#aaa", padding: "40px" }}>Carregando...</div>
        </div>
      </>
    );
  }

  const tlProgress =
    timelineNodes.length > 0 ? (tlIndex / timelineNodes.length) * 100 : 0;
  const tlCurrentNode = tlIndex > 0 ? timelineNodes[tlIndex - 1] : null;
  const isRecording = recorderRef.current?.state === "recording";

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />

        {/* Conteúdo do post */}
        <div style={{ flex: 1, padding: "40px 60px", color: "#e0e0e0", overflowY: "auto" }}>
          {editMode ? (
            <>
              <input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                style={{ width: "100%", fontSize: "24px", fontWeight: "bold", background: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "4px", padding: "8px", marginBottom: "16px", boxSizing: "border-box" }}
              />
              <div data-color-mode="dark" style={{ marginBottom: "16px" }}>
                <MDEditor value={editedContent} onChange={(v) => setEditedContent(v || "")} height={300} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={handleSave} disabled={isSaving} style={{ padding: "8px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setEditMode(false)} style={{ padding: "8px 20px", background: "#555", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h1 style={{ fontSize: "28px", marginBottom: "8px", marginTop: 0 }}>{editedTitle}</h1>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={openTimeline} title="Ver pensamento sendo construído" style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}>🎬</button>
                  {isLoggedIn && (
                    <>
                      <button onClick={() => setEditMode(true)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}>✏️</button>
                      <button onClick={handleDelete} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}>🗑️</button>
                    </>
                  )}
                </div>
              </div>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
                Autor: {post.author} · {post.subject}
              </p>
              <div data-color-mode="dark" style={{ lineHeight: "1.8", fontSize: "15px" }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) =>
                      href && href.startsWith("/post/") ? (
                        <Link to={href} style={{ color: "#4fc3f7" }}>{children}</Link>
                      ) : (
                        <a href={href} target="_blank" rel="noreferrer">{children}</a>
                      ),
                  }}
                >
                  {editedContent.replace(/\[\[([^\[\]]+)\]\]/g, (_, title) => {
                    const node = allNodes.find((n) => n.title.toLowerCase() === title.trim().toLowerCase());
                    return node ? `[${title}](/post/${node.id})` : `[${title}](#)`;
                  })}
                </ReactMarkdown>
              </div>

              {backlinks.length > 0 && (
                <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #2a2a2a" }}>
                  <h4 style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>
                    Backlinks
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {backlinks.map((node) => (
                      <li key={node.id}>
                        <Link
                          to={`/post/${node.id}`}
                          style={{ color: "#4fc3f7", fontSize: "14px", textDecoration: "none" }}
                        >
                          ← {node.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div
          ref={sidebarRef}
          style={{ width: "260px", borderLeft: "1px solid #2a2a2a", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}
        >
          {sidebarMode === "graph" ? (
            <>
              <h4 style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                Graph local
              </h4>
              <ForceGraph2D
                graphData={localGraphData}
                nodeLabel="title"
                linkColor={() => "rgba(22, 157, 211, 0.4)"}
                width={228}
                height={220}
                onNodeClick={(node) => {
                  registerEvent({ postId: node.id, eventType: "CLICK_NODE" });
                  navigate(`/post/${node.id}`);
                }}
                nodeCanvasObject={(node, ctx) => {
                  const isCurrent = node.id === postId;
                  const radius = isCurrent ? 7 : node.isStub ? 3 : 5;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = isCurrent ? "#4fc3f7" : node.isStub ? "rgba(100, 150, 200, 0.3)" : "#1a6b8a";
                  ctx.fill();
                }}
              />

              {/* Posts linkados */}
              {localGraphData.nodes.filter((n) => n.id !== postId).length > 0 && (
                <>
                  <h4 style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "8px 0 4px" }}>
                    Posts linkados
                  </h4>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    {localGraphData.nodes
                      .filter((n) => n.id !== postId)
                      .map((node) => (
                        <li key={node.id}>
                          <button
                            onClick={() => {
                              registerEvent({ postId: node.id, eventType: "CLICK_NODE" });
                              navigate(`/post/${node.id}`);
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#2a2a2a"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              padding: "5px 4px",
                              borderRadius: "4px",
                              color: node.isStub ? "#555" : "#aaa",
                              fontSize: "12px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {node.isStub ? "◦ " : "· "}{node.title}
                          </button>
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <>
              {/* Header da timeline */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                  Timeline
                </h4>
                <button
                  onClick={() => { setSidebarMode("graph"); setTlRunning(false); }}
                  style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "11px" }}
                >
                  ← grafo
                </button>
              </div>

              {/* Grafo animado */}
              <div style={{ position: "relative" }}>
                <ForceGraph2D
                  graphData={tlData}
                  nodeLabel="title"
                  linkColor={() => "rgba(22, 157, 211, 0.4)"}
                  backgroundColor="#1e1e1e"
                  width={228}
                  height={200}
                  nodeCanvasObject={(node, ctx) => {
                    const radius = node.isStub ? 3 : 5;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.fresh ? "#4fc3f7" : "#1a6b8a";
                    ctx.fill();
                  }}
                />
                {tlCurrentNode && (
                  <div style={{ position: "absolute", bottom: "4px", left: "4px", fontSize: "10px", color: "#888", pointerEvents: "none", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tlCurrentNode.title}
                  </div>
                )}
              </div>

              {/* Barra de progresso */}
              <div style={{ height: "3px", background: "#2a2a2a", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${tlProgress}%`, height: "100%", background: "#4fc3f7", transition: `width ${TL_SPEEDS[tlSpeed]}ms linear` }} />
              </div>

              {/* Controles */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => {
                    if (tlDone) resetTimeline();
                    setTlRunning((r) => !r);
                  }}
                  style={{ background: tlRunning ? "#555" : "#4fc3f7", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "11px", color: tlRunning ? "#ccc" : "#000", flexShrink: 0 }}
                >
                  {tlRunning ? "⏸" : "▶"}
                </button>
                {Object.keys(TL_SPEEDS).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTlSpeed(s)}
                    style={{ padding: "2px 6px", background: tlSpeed === s ? "#4fc3f7" : "#2a2a2a", color: tlSpeed === s ? "#000" : "#666", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "10px" }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Gravar e baixar */}
              <button
                onClick={handleRecord}
                disabled={isRecording || tlRunning}
                style={{ padding: "6px 10px", background: "#1e1e1e", color: isRecording ? "#555" : "#aaa", border: "1px solid #333", borderRadius: "4px", cursor: isRecording || tlRunning ? "default" : "pointer", fontSize: "11px" }}
              >
                {isRecording ? "⏺ Gravando..." : "⬇ Gravar e baixar"}
              </button>
            </>
          )}
        </div>

      </div>
    </>
  );
}

export default PostPage;
