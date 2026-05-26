import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import SubjectCard from "../SubjectCard";
import { authFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, username: currentUser } = useAuth();
  const isOwnProfile = currentUser === username;

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [groupedSubjects, setGroupedSubjects] = useState({});
  const [loading, setLoading] = useState(true);

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

  // Fetch all posts and group by subject
  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/search?username=${encodeURIComponent(username)}&page=0&size=1000`)
      .then((r) => (r.ok ? r.json() : { content: [] }))
      .catch(() => ({ content: [] }))
      .then((raw) => {
        const posts = Array.isArray(raw) ? raw : (raw.content ?? []);

        const groups = {};
        posts.forEach((p) => {
          const subj = p.subject || "Sem categoria";
          if (!groups[subj]) groups[subj] = { nodes: [], links: [] };
          groups[subj].nodes.push({
            id: p.id,
            title: p.title || "Sem título",
            content: p.content || "",
            isStub: p.isStub || false,
            viewCount: 0,
          });
        });

        // Build intra-subject links from post.links field
        posts.forEach((p) => {
          if (!Array.isArray(p.links)) return;
          const subj = p.subject || "Sem categoria";
          const subjectIds = new Set(groups[subj].nodes.map((n) => n.id));
          p.links.forEach((linkedId) => {
            if (subjectIds.has(linkedId)) {
              groups[subj].links.push({ source: p.id, target: linkedId });
            }
          });
        });

        setGroupedSubjects(groups);
        setLoading(false);
      });
  }, [username]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await authFetch(`/api/users/${username}/follow`, { method });
      if (!res.ok) throw new Error();
      setIsFollowing((prev) => !prev);
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
        <div style={{ flex: 1, padding: "32px 32px", overflowY: "auto" }}>

          {/* Profile header */}
          <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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

          {/* Subject cards */}
          {loading ? (
            <p style={{ color: "#444", fontSize: "13px" }}>Carregando...</p>
          ) : Object.keys(groupedSubjects).length === 0 ? (
            <p style={{ color: "#444", fontSize: "14px" }}>Nenhum post ainda.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignContent: "flex-start" }}>
              {Object.entries(groupedSubjects).map(([subject, { nodes, links }]) => (
                <SubjectCard
                  key={subject}
                  subject={subject}
                  nodes={nodes}
                  links={links}
                  onNodeClick={(node) => navigate(`/post/${node.id}`)}
                  overlay
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default UserProfile;
