import React, { useState, useEffect, useRef, useCallback } from "react";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import PostCard from "../PostCard";
import { authFetch } from "../../utils/api";

function FeedPage() {
  const [tab, setTab] = useState("explore");
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const tabRef = useRef("explore");
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const endpoint =
      tabRef.current === "feed"
        ? `/api/posts/feed?page=${pageRef.current}&size=10`
        : `/api/posts/explore?page=${pageRef.current}&size=10`;

    try {
      const res = await authFetch(endpoint);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newPosts = data.content || [];
      const isFirst = pageRef.current === 0;
      setPosts((prev) => (isFirst ? newPosts : [...prev, ...newPosts]));
      hasMoreRef.current = !data.last;
      setHasMore(!data.last);
      pageRef.current += 1;
    } catch {
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Reset and load first page when tab changes
  useEffect(() => {
    tabRef.current = tab;
    pageRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setPosts([]);
    setHasMore(true);
    loadMore();
  }, [tab, loadMore]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0, rootMargin: "120px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, maxWidth: "680px", margin: "0 auto", padding: "32px 24px" }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", marginBottom: "28px", borderBottom: "1px solid #2a2a2a" }}>
            {[
              { key: "feed", label: "Seguindo" },
              { key: "explore", label: "Explorar" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
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

          {/* Empty feed CTA */}
          {tab === "feed" && !loading && posts.length === 0 && !hasMore && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "#555", fontSize: "15px", marginBottom: "16px" }}>
                Você ainda não segue ninguém.
              </p>
              <button
                onClick={() => setTab("explore")}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px 22px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
              >
                Explorar posts
              </button>
            </div>
          )}

          {/* Post list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div ref={sentinelRef} style={{ height: "1px" }} />

          {loading && (
            <p style={{ color: "#444", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>
              Carregando...
            </p>
          )}

          {!loading && !hasMore && posts.length > 0 && (
            <p style={{ color: "#333", fontSize: "12px", textAlign: "center", padding: "24px 0" }}>
              — fim —
            </p>
          )}

        </div>
      </div>
    </>
  );
}

export default FeedPage;
