import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import PostCard from "../PostCard";
import { authFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function UserProfile() {
  const { username } = useParams();
  const { isLoggedIn, username: currentUser } = useAuth();
  const isOwnProfile = currentUser === username;

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  // Fetch social stats
  useEffect(() => {
    const followersP = fetch(`/api/users/${username}/followers`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
    const followingP = fetch(`/api/users/${username}/following`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
    const isFollowingP =
      isLoggedIn && !isOwnProfile
        ? authFetch(`/api/users/${username}/isFollowing`)
            .then((r) => (r.ok ? r.json() : false))
            .catch(() => false)
        : Promise.resolve(false);

    Promise.all([followersP, followingP, isFollowingP]).then(([f, fg, isF]) => {
      setFollowers(f);
      setFollowing(fg);
      setIsFollowing(isF);
    });
  }, [username, isLoggedIn, isOwnProfile]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/posts/search?username=${encodeURIComponent(username)}&page=${pageRef.current}&size=10`
      );
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
  }, [username]);

  // Reset and load on username change
  useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setPosts([]);
    setHasMore(true);
    loadMore();
  }, [username, loadMore]);

  // Infinite scroll
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

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await authFetch(`/api/users/${username}/follow`, { method });
      if (!res.ok) throw new Error();
      setIsFollowing((prev) => !prev);
      // Refresh follower count
      const updated = await fetch(`/api/users/${username}/followers`)
        .then((r) => (r.ok ? r.json() : followers))
        .catch(() => followers);
      setFollowers(updated);
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, maxWidth: "680px", margin: "0 auto", padding: "32px 24px" }}>

          {/* Profile header */}
          <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ color: "#e0e0e0", margin: "0 0 8px", fontSize: "22px", fontWeight: "600" }}>
                  {username}
                </h2>
                <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>
                  {followers.length} seguidor{followers.length !== 1 ? "es" : ""} · {following.length} seguindo
                </p>
              </div>
              {isLoggedIn && !isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  onMouseEnter={(e) => { if (!isFollowing) e.currentTarget.style.background = "#81d4fa"; }}
                  onMouseLeave={(e) => { if (!isFollowing) e.currentTarget.style.background = "#4fc3f7"; }}
                  style={{
                    background: isFollowing ? "none" : "#4fc3f7",
                    border: isFollowing ? "1px solid #444" : "none",
                    borderRadius: "4px",
                    color: isFollowing ? "#888" : "#000",
                    cursor: followLoading ? "default" : "pointer",
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    transition: "background 0.15s",
                  }}
                >
                  {followLoading ? "..." : isFollowing ? "Seguindo" : "Seguir"}
                </button>
              )}
            </div>
          </div>

          {/* Posts */}
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

          {!loading && !hasMore && posts.length === 0 && (
            <p style={{ color: "#444", fontSize: "14px", textAlign: "center", padding: "48px 0" }}>
              Nenhum post ainda.
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

export default UserProfile;
