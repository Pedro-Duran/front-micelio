import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ForceGraph2D } from "react-force-graph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import MDEditor, { commands } from "@uiw/react-md-editor";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import { registerEvent } from "../../utils/analytics";
import { authFetch, authFetchMultipart, parsePage } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import Comments from "../Comments";
import StubModal from "../StubModal";
import Avatar from "../Avatar";
import WikilinkSubjectsModal from "../WikilinkSubjectsModal";
import ShareButton from "../ShareButton";

const TL_SPEEDS = { Devagar: 1500, Normal: 800, "Rápido": 300 };

function PostPage() {
  const { id } = useParams();
  const postId = parseInt(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, username: currentUsername } = useAuth();

  const fromPost = location.state?.fromPost ?? null;

  const [allNodes, setAllNodes] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [post, setPost] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [stubModal, setStubModal] = useState(null); // { id, title }
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [editedSubjects, setEditedSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [pendingWikilinks, setPendingWikilinks] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);

  // Sidebar: "graph" | "timeline"
  const [sidebarMode, setSidebarMode] = useState("graph");
  const [tlIndex, setTlIndex] = useState(0);
  const [tlRunning, setTlRunning] = useState(false);
  const [tlDone, setTlDone] = useState(false);
  const [tlData, setTlData] = useState({ nodes: [], links: [] });
  const [tlSpeed, setTlSpeed] = useState("Normal");

  const sidebarRef = useRef();
  const imageInputRef = useRef(null);
  const editorApiRef = useRef(null);
  const coverInputRef = useRef(null);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [bannerPosY, setBannerPosY] = useState(50);
  const [bannerDragging, setBannerDragging] = useState(false);
  const bannerIsDraggingRef = useRef(false);
  const bannerDragStartRef = useRef({ clientY: 0, pos: 50 });

  useEffect(() => {
    fetch("/api/posts/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then(setAllSubjects);
  }, []);

  // VIEW analytics — captures ref/utm from URL on mount and clears them
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const referredBy = searchParams.get("ref") || undefined;
    const utmSource = searchParams.get("utm_source") || undefined;
    if (referredBy || utmSource) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    const startTime = Date.now();
    return () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      registerEvent({ postId, eventType: "VIEW", duration, referredBy, utmSource });
    };
  }, [postId]);

  useEffect(() => {
    fetch("/api/posts/verPosts")
      .then((res) => {
        if (!res.ok) throw new Error("Erro na requisição");
        return res.json();
      })
      .then((raw) => parsePage(raw).content)
      .then((data) => {
        const getSubjs = (p) => Array.isArray(p.subjects) && p.subjects.length > 0
          ? p.subjects : (p.subject ? [p.subject] : []);

        const nodes = data.map((p) => ({
          id: p.id,
          title: p.title || "Sem título",
          content: p.content || "",
          author: p.authorUsername || p.author?.username || "Desconhecido",
          authorUsername: p.authorUsername || p.author?.username || null,
          subjects: getSubjs(p),
          subject: getSubjs(p)[0] || "Sem categoria",
          isStub: p.isStub || false,
          createdAt: p.createdAt || null,
          coverImageUrl: p.coverImageUrl || null,
          avatarUrl: p.authorAvatarUrl || p.author?.avatarUrl || null,
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
          setEditedSubjects(current.subjects?.length > 0 ? current.subjects : (current.subject ? [current.subject] : []));
        }
        const rawPost = data.find((p) => p.id === postId);
        if (rawPost) {
          setLikeCount(rawPost.likeCount || 0);
          setLikedByMe(rawPost.likedByMe || false);
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

  const AUTHOR_PALETTE = ["#4fc3f7", "#81c784", "#ffb74d", "#f06292", "#ba68c8", "#4db6ac", "#fff176", "#ff8a65"];

  const authorColorMap = useMemo(() => {
    const bySubject = {};
    allNodes.forEach((n) => {
      if (!n.isStub && n.subject && n.authorUsername) {
        if (!bySubject[n.subject]) bySubject[n.subject] = new Set();
        bySubject[n.subject].add(n.authorUsername);
      }
    });
    const map = {};
    Object.entries(bySubject).forEach(([subject, authSet]) => {
      if (authSet.size >= 2) {
        authSet.forEach((name) => {
          let h = 0;
          for (let i = 0; i < name.length; i++) { h = ((h << 5) - h) + name.charCodeAt(i); h |= 0; }
          map[`${name}::${subject}`] = AUTHOR_PALETTE[Math.abs(h) % AUTHOR_PALETTE.length];
        });
      }
    });
    return map;
  }, [allNodes]); // eslint-disable-line react-hooks/exhaustive-deps

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


  const imageUploadCommand = {
    name: "imageUpload",
    keyCommand: "imageUpload",
    buttonProps: { "aria-label": "Inserir imagem", title: "Inserir imagem" },
    icon: (
      <svg viewBox="0 0 16 16" width="12px" height="12px" fill="currentColor">
        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
      </svg>
    ),
    execute: (_state, api) => {
      editorApiRef.current = api;
      imageInputRef.current?.click();
    },
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await authFetchMultipart("/api/posts/images", formData);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const url = data.url;
      editorApiRef.current?.replaceSelection(`![${file.name}](${url})`);
    } catch {
      alert("Erro ao enviar imagem.");
    } finally {
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await authFetchMultipart(`/api/posts/${postId}/cover`, formData);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPost((prev) => ({ ...prev, coverImageUrl: data.coverImageUrl }));
    } catch {
      alert("Erro ao enviar capa.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(`coverPos_post_${postId}`);
    setBannerPosY(stored != null ? Number(stored) : 50);
  }, [postId]);

  const onBannerMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === "button") return;
    e.preventDefault();
    bannerIsDraggingRef.current = true;
    setBannerDragging(true);
    bannerDragStartRef.current = { clientY: e.clientY, pos: bannerPosY };
  };

  const onBannerMouseMove = (e) => {
    if (!bannerIsDraggingRef.current) return;
    const delta = e.clientY - bannerDragStartRef.current.clientY;
    const newPos = Math.max(0, Math.min(100, bannerDragStartRef.current.pos + delta * 0.3));
    setBannerPosY(newPos);
  };

  const onBannerMouseUp = () => {
    if (!bannerIsDraggingRef.current) return;
    bannerIsDraggingRef.current = false;
    setBannerDragging(false);
    setBannerPosY((pos) => {
      localStorage.setItem(`coverPos_post_${postId}`, String(pos));
      return pos;
    });
  };

  const extractImageUrls = (content) => {
    const regex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
    const urls = [];
    let match;
    while ((match = regex.exec(content)) !== null) urls.push(match[1]);
    return [...new Set(urls)];
  };

  const parseWikilinks = (content) => {
    const regex = /\[\[([^\[\]]+)\]\]/g;
    const titles = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      titles.push(match[1].trim());
    }
    return [...new Set(titles)];
  };

  const doSave = async (wikilinkAssignments) => {
    setPendingWikilinks(null);
    const newWikilinks = parseWikilinks(editedContent);
    const transitioningFromStub = post.isStub && editedContent.trim().length > 0;

    const body = {
      id: postId,
      title: editedTitle,
      content: editedContent,
      links: [],
      wikilinks: wikilinkAssignments,
      subjects: editedSubjects,
      ...(transitioningFromStub ? { isStub: false } : {}),
    };

    try {
      setIsSaving(true);
      const response = await authFetch("/api/posts/updatePost", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Falha ao salvar");
      const updated = await response.json();

      // Delete stub posts whose [[wikilink]] was removed from the content
      const oldWikilinks = parseWikilinks(post.content);
      const newWikilinkSet = new Set(newWikilinks.map((t) => t.toLowerCase()));
      const removedTitles = oldWikilinks.filter((t) => !newWikilinkSet.has(t.toLowerCase()));
      const removedStubIds = removedTitles
        .map((title) => allNodes.find((n) => n.title.toLowerCase() === title.toLowerCase()))
        .filter((n) => n && n.isStub)
        .map((n) => n.id);
      await Promise.all(
        removedStubIds.map((id) =>
          authFetch(`/api/posts/deletePost?id=${id}`, { method: "DELETE" })
        )
      );

      // Delete inline images from S3 that were removed from the content
      const oldImageUrls = extractImageUrls(post.content);
      const newImageUrlSet = new Set(extractImageUrls(editedContent));
      const removedImageUrls = oldImageUrls.filter((url) => !newImageUrlSet.has(url));
      await Promise.all(
        removedImageUrls.map((url) =>
          authFetch(`/api/posts/images?url=${encodeURIComponent(url)}`, { method: "DELETE" })
        )
      );

      setPost((prev) => ({ ...prev, title: updated.title, content: updated.content, isStub: updated.isStub ?? prev.isStub }));
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

  const handleSave = async () => {
    const newWikilinks = parseWikilinks(editedContent);
    const existingTitles = new Set(allNodes.map((n) => n.title.toLowerCase()));
    const oldWikilinkSet = new Set(parseWikilinks(post.content).map((t) => t.toLowerCase()));

    // Only ask about subjects for wikilinks that are new (not existing posts, not previously present)
    const trulyNew = newWikilinks.filter(
      (t) => !existingTitles.has(t.toLowerCase()) && !oldWikilinkSet.has(t.toLowerCase())
    );

    if (trulyNew.length > 0) {
      setPendingWikilinks(trulyNew);
      return;
    }

    // For existing/unchanged wikilinks, just send them with parent subjects
    await doSave(newWikilinks.map((t) => ({ title: t, subjects: editedSubjects })));
  };

  const goToPost = (targetId) =>
    navigate(`/post/${targetId}`, { state: { fromPost: { id: postId, title: post?.title ?? "" } } });

  const handleLike = async () => {
    if (!isLoggedIn) return;
    const wasLiked = likedByMe;
    setLikedByMe(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      const res = await authFetch(`/api/posts/${postId}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
    } catch {
      setLikedByMe(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
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

  return (
    <>
      {stubModal && (
        <StubModal
          postId={stubModal.id}
          postTitle={stubModal.title}
          onClose={() => setStubModal(null)}
        />
      )}
      {pendingWikilinks && (
        <WikilinkSubjectsModal
          wikilinks={pendingWikilinks}
          defaultSubjects={editedSubjects}
          allSubjects={allSubjects}
          confirmLabel="Confirmar e salvar"
          onConfirm={(assignments) => {
            const assignmentMap = Object.fromEntries(
              assignments.map(({ title, subjects }) => [title.toLowerCase(), subjects])
            );
            const merged = parseWikilinks(editedContent).map((t) => ({
              title: t,
              subjects: assignmentMap[t.toLowerCase()] || editedSubjects,
            }));
            doSave(merged);
          }}
          onCancel={() => setPendingWikilinks(null)}
        />
      )}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={lightboxSrc}
            alt=""
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "4px" }}
          />
        </div>
      )}
      {showSubjectModal && (
        <div onClick={() => setShowSubjectModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#242424", border: "1px solid #333", borderRadius: "8px", width: "380px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: "15px" }}>Categorias do post</h3>
            {allSubjects.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {allSubjects.map((s) => {
                  const sel = editedSubjects.includes(s);
                  return (
                    <button key={s} onClick={() => setEditedSubjects((prev) => sel ? prev.filter((x) => x !== s) : [...prev, s])}
                      style={{ background: sel ? "#1d3a4a" : "none", border: `1px solid ${sel ? "#4fc3f7" : "#444"}`, borderRadius: "20px", color: sel ? "#4fc3f7" : "#666", padding: "5px 14px", fontSize: "12px", cursor: "pointer" }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={newSubjectInput} onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const s = newSubjectInput.trim(); if (!s) return; if (!editedSubjects.includes(s)) setEditedSubjects((p) => [...p, s]); if (!allSubjects.includes(s)) setAllSubjects((p) => [...p, s]); setNewSubjectInput(""); } }}
                placeholder="Nova categoria..." style={{ flex: 1, background: "#1e1e1e", border: "1px solid #444", borderRadius: "4px", padding: "6px 10px", color: "#e0e0e0", fontSize: "13px", outline: "none" }} />
              <button onClick={() => { const s = newSubjectInput.trim(); if (!s) return; if (!editedSubjects.includes(s)) setEditedSubjects((p) => [...p, s]); if (!allSubjects.includes(s)) setAllSubjects((p) => [...p, s]); setNewSubjectInput(""); }}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>+</button>
            </div>
            <button onClick={() => setShowSubjectModal(false)} style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
              Confirmar
            </button>
          </div>
        </div>
      )}
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
              {/* Subjects */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "12px" }}>
                {editedSubjects.map((s) => (
                  <span key={s} style={{ background: "#1d3a4a", color: "#4fc3f7", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", border: "1px solid #2a5a72" }}>
                    {s}
                    <button type="button" onClick={() => setEditedSubjects((prev) => prev.filter((x) => x !== s))}
                      style={{ background: "none", border: "none", color: "#4fc3f7", cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1 }}>×</button>
                  </span>
                ))}
                <button type="button" onClick={() => setShowSubjectModal(true)}
                  style={{ background: "none", border: "1px dashed #444", borderRadius: "20px", color: "#555", padding: "3px 10px", fontSize: "12px", cursor: "pointer" }}>
                  + subject
                </button>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
              <div data-color-mode="dark" style={{ marginBottom: "16px" }}>
                <MDEditor
                  value={editedContent}
                  onChange={(v) => setEditedContent(v || "")}
                  height={300}
                  extraCommands={[imageUploadCommand]}
                />
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
              {/* Cover image */}
              {post.coverImageUrl && (
                <div
                  onMouseDown={onBannerMouseDown}
                  onMouseMove={onBannerMouseMove}
                  onMouseUp={onBannerMouseUp}
                  onMouseLeave={onBannerMouseUp}
                  style={{
                    marginBottom: "28px", marginLeft: "-60px", marginRight: "-60px", marginTop: "-40px",
                    position: "relative", userSelect: "none",
                    cursor: bannerDragging ? "grabbing" : "grab",
                  }}
                >
                  <img
                    src={post.coverImageUrl}
                    alt="capa"
                    style={{ width: "100%", height: "160px", objectFit: "cover", display: "block", pointerEvents: "none", objectPosition: `center ${bannerPosY}%` }}
                  />
                  {isLoggedIn && (
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      title="Alterar capa"
                      style={{ position: "absolute", bottom: "10px", right: "14px", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#ccc", cursor: "pointer", fontSize: "11px", padding: "4px 10px" }}
                    >
                      {uploadingCover ? "Enviando…" : "Alterar capa"}
                    </button>
                  )}
                </div>
              )}

              {/* Cover upload button (no cover yet) */}
              {!post.coverImageUrl && isLoggedIn && (
                <div style={{ marginBottom: "16px" }}>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    style={{ background: "none", border: "1px dashed #333", borderRadius: "4px", color: "#555", cursor: "pointer", fontSize: "11px", padding: "6px 14px" }}
                  >
                    {uploadingCover ? "Enviando…" : "+ Adicionar capa"}
                  </button>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleCoverUpload}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h1 style={{ fontSize: "28px", marginBottom: "8px", marginTop: 0 }}>{editedTitle}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShareButton postId={postId} username={currentUsername} />
                  {isLoggedIn && !post.isStub && (
                    <button
                      onClick={() => navigate("/novoPost", { state: { refTitle: post.title, refPostId: postId } })}
                      style={{ background: "none", border: "1px solid #333", borderRadius: "4px", color: "#666", cursor: "pointer", fontSize: "11px", padding: "3px 8px", whiteSpace: "nowrap" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; e.currentTarget.style.borderColor = "#4fc3f7"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#333"; }}
                    >
                      ref post
                    </button>
                  )}
                  <button onClick={openTimeline} title="Ver pensamento sendo construído" style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}>🎬</button>
                  {isLoggedIn && (
                    <>
                      <button onClick={() => setEditMode(true)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}>✏️</button>
                      <button onClick={handleDelete} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}>🗑️</button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                    Autor: <span style={{ color: "#aaa" }}>{post.author}</span>
                  </p>
                  <p style={{ color: "#888", fontSize: "13px", margin: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                    <span>Assunto:</span>
                    {(post.subjects?.length > 0 ? post.subjects : [post.subject]).filter(Boolean).map((s) => (
                      <Link
                        key={s}
                        to={`/subject/${encodeURIComponent(s)}`}
                        style={{ color: "#888", textDecoration: "none", borderBottom: "1px solid #444" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; e.currentTarget.style.borderBottomColor = "#4fc3f7"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderBottomColor = "#444"; }}
                      >
                        {s}
                      </Link>
                    ))}
                  </p>
                </div>
                <button
                  onClick={handleLike}
                  title={isLoggedIn ? (likedByMe ? "Descurtir" : "Curtir") : "Faça login para curtir"}
                  style={{
                    background: "none",
                    border: `1px solid ${likedByMe ? "#c2185b" : "#333"}`,
                    borderRadius: "20px",
                    color: likedByMe ? "#f06292" : "#555",
                    cursor: isLoggedIn ? "pointer" : "default",
                    fontSize: "13px",
                    padding: "4px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "color 0.15s, border-color 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (isLoggedIn && !likedByMe) { e.currentTarget.style.color = "#f06292"; e.currentTarget.style.borderColor = "#c2185b"; } }}
                  onMouseLeave={(e) => { if (!likedByMe) { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#333"; } }}
                >
                  <span style={{ fontSize: "15px" }}>{likedByMe ? "♥" : "♡"}</span>
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>
              </div>
              <div data-color-mode="dark" style={{ lineHeight: "1.8", fontSize: "15px" }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    a: ({ href, children }) =>
                      href && href.startsWith("/post/") ? (
                        <Link to={href} style={{ color: "#4fc3f7" }}>{children}</Link>
                      ) : (
                        <a href={href} target="_blank" rel="noreferrer">{children}</a>
                      ),
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt}
                        onClick={() => setLightboxSrc(src)}
                        style={{
                          maxWidth: "380px",
                          maxHeight: "260px",
                          objectFit: "contain",
                          display: "block",
                          margin: "12px 0",
                          borderRadius: "4px",
                          cursor: "zoom-in",
                          border: "1px solid #2a2a2a",
                        }}
                      />
                    ),
                  }}
                >
                  {editedContent.replace(/\[\[([^\[\]]+)\]\]/g, (_, title) => {
                    const node = allNodes.find((n) => n.title.toLowerCase() === title.trim().toLowerCase());
                    return node ? `[${title}](/post/${node.id})` : `[${title}](#)`;
                  })}
                </ReactMarkdown>
              </div>


              <Comments postId={postId} />
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
              {fromPost && (
                <button
                  onClick={() => navigate(`/post/${fromPost.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    width: "100%", marginBottom: "12px",
                    background: "#1a2a35",
                    border: "1px solid #1e4a62",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    cursor: "pointer", textAlign: "left",
                    color: "#4fc3f7", fontSize: "12px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a4a"; e.currentTarget.style.borderColor = "#4fc3f7"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#1a2a35"; e.currentTarget.style.borderColor = "#1e4a62"; }}
                >
                  <span style={{ fontSize: "14px", lineHeight: 1, flexShrink: 0 }}>←</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
                    {fromPost.title}
                  </span>
                </button>
              )}
              <h4 style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                Graph local
              </h4>
              <ForceGraph2D
                graphData={localGraphData}
                nodeLabel="title"
                pixelRatio={window.devicePixelRatio}
                linkColor={() => "rgba(22, 157, 211, 0.4)"}
                width={228}
                height={220}
                onNodeClick={(node) => {
                  if (node.isStub && node.authorUsername !== currentUsername) { setStubModal({ id: node.id, title: node.title }); return; }
                  registerEvent({ postId: node.id, eventType: "CLICK_NODE" });
                  goToPost(node.id);
                }}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const isCurrent = node.id === postId;
                  const radius = isCurrent ? 7 : node.isStub ? 3 : 5;
                  const colorKey = `${node.authorUsername}::${node.subject}`;
                  const fillColor = node.isStub
                    ? "rgba(100, 150, 200, 0.3)"
                    : (authorColorMap[colorKey] || (isCurrent ? "#4fc3f7" : "#1a6b8a"));
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = fillColor;
                  ctx.fill();
                  if (isCurrent) {
                    ctx.strokeStyle = "rgba(255,255,255,0.45)";
                    ctx.lineWidth = 1.5 / globalScale;
                    ctx.stroke();
                  }

                  const fontSize = 10 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "top";
                  ctx.fillStyle = isCurrent
                    ? "rgba(79, 195, 247, 0.9)"
                    : node.isStub
                    ? "rgba(100, 150, 200, 0.55)"
                    : "rgba(200, 200, 200, 0.8)";
                  ctx.fillText(node.title, node.x, node.y + radius + 2 / globalScale);
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
                              goToPost(node.id);
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

              {/* Referenciado por */}
              {backlinks.length > 0 && (
                <>
                  <h4 style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "12px 0 6px" }}>
                    Referenciado por
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {backlinks.map((node) => (
                      <div
                        key={node.id}
                        style={{ display: "flex", alignItems: "stretch", background: "#242424", border: "1px solid #2a2a2a", borderRadius: "5px", overflow: "hidden" }}
                      >
                        <button
                          onClick={() => navigate(`/user/${node.authorUsername}`)}
                          title={node.authorUsername}
                          style={{ display: "flex", alignItems: "center", padding: "6px 8px", background: "none", border: "none", borderRight: "1px solid #2a2a2a", cursor: "pointer", flexShrink: 0 }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#2e2e2e"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                        >
                          <Avatar avatarUrl={node.avatarUrl} username={node.authorUsername} size={20} />
                        </button>
                        <button
                          onClick={() => goToPost(node.id)}
                          style={{ flex: 1, padding: "6px 8px", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "#666", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; e.currentTarget.style.background = "#1e2a30"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "none"; }}
                        >
                          {node.title}
                        </button>
                      </div>
                    ))}
                  </div>
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
                  pixelRatio={window.devicePixelRatio}
                  linkColor={() => "rgba(22, 157, 211, 0.4)"}
                  backgroundColor="#1e1e1e"
                  width={228}
                  height={200}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const radius = node.isStub ? 3 : 5;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.fresh ? "#4fc3f7" : "#1a6b8a";
                    ctx.fill();

                    const fontSize = 10 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";
                    ctx.fillStyle = node.fresh ? "rgba(79, 195, 247, 0.9)" : "rgba(200, 200, 200, 0.6)";
                    ctx.fillText(node.title, node.x, node.y + radius + 2 / globalScale);
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

            </>
          )}
        </div>

      </div>
    </>
  );
}

export default PostPage;
