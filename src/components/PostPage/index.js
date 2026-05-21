import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ForceGraph2D } from "react-force-graph";
import ReactMarkdown from "react-markdown";
import MDEditor from "@uiw/react-md-editor";
import Cabecalho from "../Cabecalho";
import { registerEvent } from "../../utils/analytics";

function PostPage() {
  const { id } = useParams();
  const postId = parseInt(id);
  const navigate = useNavigate();

  const [allNodes, setAllNodes] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [post, setPost] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      const response = await fetch("/api/posts/updatePost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  if (!post) {
    return (
      <>
        <Cabecalho />
        <div style={{ background: "#1e1e1e", color: "#aaa", minHeight: "100vh", padding: "40px" }}>
          Carregando...
        </div>
      </>
    );
  }

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>

        {/* Conteúdo do post */}
        <div style={{ flex: 1, padding: "40px 60px", color: "#e0e0e0", overflowY: "auto" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              marginBottom: "24px",
              fontSize: "14px",
              padding: 0,
            }}
          >
            ← Voltar
          </button>

          {editMode ? (
            <>
              <input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "24px",
                  fontWeight: "bold",
                  background: "#2a2a2a",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  padding: "8px",
                  marginBottom: "16px",
                  boxSizing: "border-box",
                }}
              />
              <div data-color-mode="dark" style={{ marginBottom: "16px" }}>
                <MDEditor
                  value={editedContent}
                  onChange={(value) => setEditedContent(value || "")}
                  height={300}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: "8px 20px",
                    background: "#4caf50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  style={{
                    padding: "8px 20px",
                    background: "#555",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h1 style={{ fontSize: "28px", marginBottom: "8px", marginTop: 0 }}>{editedTitle}</h1>
                <button
                  onClick={() => setEditMode(true)}
                  style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}
                >
                  ✏️
                </button>
              </div>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
                Autor: {post.author} · {post.subject}
              </p>
              <div data-color-mode="dark" style={{ lineHeight: "1.8", fontSize: "15px" }}>
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) =>
                      href && href.startsWith("/post/") ? (
                        <Link to={href} style={{ color: "#4fc3f7" }}>
                          {children}
                        </Link>
                      ) : (
                        <a href={href} target="_blank" rel="noreferrer">
                          {children}
                        </a>
                      ),
                  }}
                >
                  {editedContent.replace(/\[\[([^\[\]]+)\]\]/g, (_, title) => {
                    const node = allNodes.find(
                      (n) => n.title.toLowerCase() === title.trim().toLowerCase()
                    );
                    return node ? `[${title}](/post/${node.id})` : `[${title}](#)`;
                  })}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>

        {/* Sidebar com grafo local */}
        <div
          style={{
            width: "260px",
            borderLeft: "1px solid #2a2a2a",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <h4
            style={{
              color: "#555",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: 0,
            }}
          >
            Graph local
          </h4>
          <ForceGraph2D
            graphData={localGraphData}
            nodeLabel="title"
            linkColor={() => "rgba(22, 157, 211, 0.4)"}
            width={228}
            height={260}
            onNodeClick={(node) => {
              registerEvent({ postId: node.id, eventType: "CLICK_NODE" });
              navigate(`/post/${node.id}`);
            }}
            nodeCanvasObject={(node, ctx) => {
              const isCurrent = node.id === postId;
              const radius = isCurrent ? 7 : node.isStub ? 3 : 5;
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = isCurrent
                ? "#4fc3f7"
                : node.isStub
                ? "rgba(100, 150, 200, 0.3)"
                : "#1a6b8a";
              ctx.fill();
            }}
          />
        </div>

      </div>
    </>
  );
}

export default PostPage;
