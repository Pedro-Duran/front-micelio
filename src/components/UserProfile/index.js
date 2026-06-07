import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import SubjectCard from "../SubjectCard";
import Avatar from "../Avatar";
import { authFetch, authFetchMultipart, parsePage } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, username: currentUser } = useAuth();
  const isOwnProfile = currentUser === username;
  const fileInputRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [socialModal, setSocialModal] = useState(null); // "followers" | "following" | null

  const [groupedSubjects, setGroupedSubjects] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch user info (id + avatarUrl) via search
  useEffect(() => {
    fetch(`/api/users/search?username=${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : (raw.content ?? []);
        const match = list.find((u) => u.username === username) || list[0];
        if (match) {
          setUserId(match.id);
          setAvatarUrl(match.avatarUrl || null);
        }
      });
  }, [username]);

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
      setFollowers(parsePage(f).content);
      setFollowing(parsePage(fg).content);
      setIsFollowing(isF);
    });
  }, [username, isLoggedIn, isOwnProfile]);

  // Fetch all posts and group by subject.
  // verPosts is used as a supplement to capture stubs that search may exclude.
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/posts/search?username=${encodeURIComponent(username)}&page=0&size=1000`)
        .then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      fetch(`/api/posts/verPosts?page=0&size=1000`)
        .then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    ]).then(([searchRaw, verRaw]) => {
      const searchPosts = parsePage(searchRaw).content;
      const allPosts = parsePage(verRaw).content;

      // Stubs from verPosts that belong to this user and aren't already in search results
      const searchIds = new Set(searchPosts.map((p) => p.id));
      const missingStubs = allPosts.filter((p) => {
        const author = p.authorUsername || p.author?.username;
        return p.isStub && author === username && !searchIds.has(p.id);
      });

      const posts = [...searchPosts, ...missingStubs];

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
          coverImageUrl: p.coverImageUrl || null,
          authorUsername: p.authorUsername || p.author?.username || null,
        });
      });
      posts.forEach((p) => {
        if (!Array.isArray(p.links)) return;
        const subj = p.subject || "Sem categoria";
        const subjectIds = new Set(groups[subj].nodes.map((n) => n.id));
        p.links.forEach((linkedId) => {
          if (subjectIds.has(linkedId))
            groups[subj].links.push({ source: p.id, target: linkedId });
        });
      });
      setGroupedSubjects(groups);
      setLoading(false);
    });
  }, [username]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await authFetch(`/api/users/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
      setIsFollowing((prev) => !prev);
      const updated = await fetch(`/api/users/${username}/followers`)
        .then((r) => (r.ok ? r.json() : followers))
        .catch(() => followers);
      setFollowers(updated);
    } catch {
      // ignore
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetchMultipart(`/api/users/${userId}/avatar`, formData);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvatarUrl(data.avatarUrl);
    } catch {
      alert("Erro ao enviar foto de perfil.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const socialList = socialModal === "followers" ? followers : following;

  return (
    <>
      {socialModal && (
        <div
          onClick={() => setSocialModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#242424", border: "1px solid #333", borderRadius: "8px", width: "320px", maxHeight: "480px", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #2a2a2a" }}>
              <span style={{ color: "#e0e0e0", fontSize: "14px", fontWeight: "600" }}>
                {socialModal === "followers" ? "Seguidores" : "Seguindo"}
              </span>
              <button onClick={() => setSocialModal(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: "6px 0" }}>
              {socialList.length === 0 ? (
                <p style={{ color: "#555", fontSize: "13px", padding: "16px 20px", margin: 0 }}>
                  {socialModal === "followers" ? "Nenhum seguidor ainda." : "Não está seguindo ninguém."}
                </p>
              ) : socialList.map((user) => (
                <button
                  key={user.username}
                  onClick={() => { navigate(`/user/${user.username}`); setSocialModal(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#2e2e2e"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  <Avatar avatarUrl={user.avatarUrl} username={user.username} size={32} />
                  <span style={{ color: "#e0e0e0", fontSize: "14px" }}>{user.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, padding: "32px 32px", overflowY: "auto" }}>

          {/* Profile header */}
          <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>

              {/* Avatar */}
              <div
                style={{ position: "relative", cursor: isOwnProfile ? "pointer" : "default" }}
                onMouseEnter={() => isOwnProfile && setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => isOwnProfile && fileInputRef.current?.click()}
              >
                <Avatar avatarUrl={avatarUrl} username={username} size={72} />
                {isOwnProfile && (avatarHover || uploadingAvatar) && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px",
                  }}>
                    {uploadingAvatar ? "⏳" : "📷"}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <h2 style={{ color: "#e0e0e0", margin: "0 0 6px", fontSize: "22px", fontWeight: "600" }}>
                  {username}
                </h2>
                <p style={{ color: "#555", fontSize: "13px", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => setSocialModal("followers")}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, fontSize: "13px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                  >
                    {followers.length} seguidor{followers.length !== 1 ? "es" : ""}
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setSocialModal("following")}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, fontSize: "13px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                  >
                    {following.length} seguindo
                  </button>
                </p>
              </div>
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
                  isOwner={isOwnProfile}
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
