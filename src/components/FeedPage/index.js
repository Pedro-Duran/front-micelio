import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import { authFetch, parsePage } from "../../utils/api";

const PAGE_SIZE = 20;

function FeedPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("explore");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const switchTab = (newTab) => {
    if (newTab === tab) return;
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setTab(newTab);
  };

  useEffect(() => {
    setLoading(true);
    const endpoint =
      tab === "feed"
        ? `/api/posts/feed?page=${page}&size=${PAGE_SIZE}`
        : `/api/posts/verPosts?page=${page}&size=${PAGE_SIZE}`;

    const req = tab === "feed" ? authFetch(endpoint) : fetch(endpoint);
    req
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((raw) => {
        const { content, isLast } = parsePage(raw);
        setPosts((prev) => (page === 0 ? content : [...prev, ...content]));
        setHasMore(!isLast);
        setLoading(false);
      });
  }, [tab, page]);

  const isEmpty = !loading && posts.length === 0;

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>

          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: "28px", borderBottom: "1px solid #2a2a2a" }}>
            {[
              { key: "feed", label: "Seguindo" },
              { key: "explore", label: "Explorar" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px 18px",
                  color: tab === key ? "#4fc3f7" : "#555",
                  fontSize: "13px",
                  fontWeight: tab === key ? "600" : "400",
                  cursor: "pointer",
                  borderBottom: tab === key ? "2px solid #4fc3f7" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Post list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "680px" }}>
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 14px",
                  background: "#242424", border: "1px solid #2e2e2e", borderRadius: "6px",
                  cursor: "pointer", textAlign: "left", width: "100%",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3a3a3a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2e2e2e"; }}
              >
                {post.coverImageUrl && (
                  <img
                    src={post.coverImageUrl}
                    alt=""
                    style={{ width: "52px", height: "40px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden" }}>
                  <span style={{
                    color: post.isStub ? "#555" : "#e0e0e0",
                    fontSize: "14px", fontWeight: "500",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontStyle: post.isStub ? "italic" : "normal",
                  }}>
                    {post.title}
                  </span>
                  <span style={{ color: "#444", fontSize: "12px" }}>
                    {post.subject && (
                      <span style={{ color: "#4fc3f7", marginRight: "6px" }}>{post.subject}</span>
                    )}
                    {post.authorUsername || post.author?.username}
                    {post.isStub && <span style={{ marginLeft: "6px" }}>· stub</span>}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {loading && (
            <p style={{ color: "#444", fontSize: "13px", marginTop: "20px" }}>Carregando...</p>
          )}

          {isEmpty && tab === "feed" && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "#555", fontSize: "15px", marginBottom: "16px" }}>
                Você ainda não segue ninguém.
              </p>
              <button
                onClick={() => switchTab("explore")}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px 22px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
              >
                Explorar posts
              </button>
            </div>
          )}

          {isEmpty && tab === "explore" && (
            <p style={{ color: "#444", fontSize: "14px" }}>Nenhum post encontrado.</p>
          )}

          {hasMore && !loading && posts.length > 0 && (
            <div style={{ marginTop: "16px", maxWidth: "680px" }}>
              <button
                onClick={() => setPage((p) => p + 1)}
                style={{ width: "100%", padding: "10px", background: "none", border: "1px solid #2e2e2e", borderRadius: "6px", color: "#555", cursor: "pointer", fontSize: "13px" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#999"; e.currentTarget.style.borderColor = "#3a3a3a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#2e2e2e"; }}
              >
                Carregar mais
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default FeedPage;
