import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import SubjectCard from "../SubjectCard";
import Avatar from "../Avatar";
import { authFetch, authFetchMultipart, parsePage } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, username: currentUser } = useAuth();
  const { t } = useTranslation();
  const isOwnProfile = currentUser === username;
  const fileInputRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarLightbox, setAvatarLightbox] = useState(false);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [socialModal, setSocialModal] = useState(null);

  const [groupedSubjects, setGroupedSubjects] = useState({});
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const followersP = fetch(`/api/users/${username}/followers`)
      .then((r) => (r.ok ? r.json() : [])).catch(() => []);
    const followingP = fetch(`/api/users/${username}/following`)
      .then((r) => (r.ok ? r.json() : [])).catch(() => []);
    const isFollowingP =
      isLoggedIn && !isOwnProfile
        ? authFetch(`/api/users/${username}/isFollowing`)
            .then((r) => (r.ok ? r.json() : false)).catch(() => false)
        : Promise.resolve(false);

    Promise.all([followersP, followingP, isFollowingP]).then(([f, fg, isF]) => {
      setFollowers(parsePage(f).content);
      setFollowing(parsePage(fg).content);
      setIsFollowing(isF);
    });
  }, [username, isLoggedIn, isOwnProfile]);

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

      const searchIds = new Set(searchPosts.map((p) => p.id));
      const missingStubs = allPosts.filter((p) => {
        const author = p.authorUsername || p.author?.username;
        return p.isStub && author === username && !searchIds.has(p.id);
      });

      const rawPosts = [...searchPosts, ...missingStubs];
      const writtenTitles = new Set(
        rawPosts.filter((p) => !p.isStub).map((p) => p.title?.toLowerCase().trim()).filter(Boolean)
      );
      const posts = rawPosts.filter(
        (p) => !p.isStub || !writtenTitles.has(p.title?.toLowerCase().trim())
      );

      const getSubjs = (p) => Array.isArray(p.subjects) && p.subjects.length > 0
        ? p.subjects : (p.subject ? [p.subject] : [t("sidebar.noCategory")]);

      const groups = {};
      posts.forEach((p) => {
        const subjs = getSubjs(p);
        const node = {
          id: p.id,
          title: p.title || t("sidebar.noCategory"),
          content: p.content || "",
          subjects: subjs,
          subject: subjs[0] || t("sidebar.noCategory"),
          isStub: p.isStub || false,
          viewCount: 0,
          coverImageUrl: p.coverImageUrl || null,
          authorUsername: p.authorUsername || p.author?.username || null,
        };
        subjs.forEach((subj) => {
          if (!groups[subj]) groups[subj] = { nodes: [], links: [] };
          if (!groups[subj].nodes.find((n) => n.id === p.id)) groups[subj].nodes.push(node);
        });
      });
      posts.forEach((p) => {
        if (!Array.isArray(p.links)) return;
        getSubjs(p).forEach((subj) => {
          if (!groups[subj]) return;
          const subjectIds = new Set(groups[subj].nodes.map((n) => n.id));
          p.links.forEach((linkedId) => {
            if (subjectIds.has(linkedId))
              groups[subj].links.push({ source: p.id, target: linkedId });
          });
        });
      });
      setGroupedSubjects(groups);
      setLoading(false);
    });
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await authFetch(`/api/users/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
      setIsFollowing((prev) => !prev);
      const updated = await fetch(`/api/users/${username}/followers`)
        .then((r) => (r.ok ? r.json() : followers)).catch(() => followers);
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
      alert(t("userProfile.photoError"));
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const socialList = socialModal === "followers" ? followers : following;

  return (
    <>
      {avatarLightbox && (
        <div onClick={() => setAvatarLightbox(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", cursor: "zoom-out" }}>
          <Avatar avatarUrl={avatarUrl} username={username} size={220} />
          {isOwnProfile && (
            <button
              onClick={(e) => { e.stopPropagation(); setAvatarLightbox(false); fileInputRef.current?.click(); }}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", color: "#ccc", cursor: "pointer", fontSize: "13px", padding: "7px 18px" }}
            >
              {uploadingAvatar ? t("userProfile.uploading") : t("userProfile.changePhoto")}
            </button>
          )}
        </div>
      )}
      {socialModal && (
        <div onClick={() => setSocialModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#242424", border: "1px solid #333", borderRadius: "8px", width: "320px", maxHeight: "480px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #2a2a2a" }}>
              <span style={{ color: "#e0e0e0", fontSize: "14px", fontWeight: "600" }}>
                {socialModal === "followers" ? t("userProfile.followers") : t("userProfile.following")}
              </span>
              <button onClick={() => setSocialModal(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: "6px 0" }}>
              {socialList.length === 0 ? (
                <p style={{ color: "#555", fontSize: "13px", padding: "16px 20px", margin: 0 }}>
                  {socialModal === "followers" ? t("userProfile.noFollowers") : t("userProfile.notFollowing")}
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

          <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{ position: "relative", cursor: "pointer" }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => setAvatarLightbox(true)}
              >
                <Avatar avatarUrl={avatarUrl} username={username} size={72} />
                {avatarHover && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                    🔍
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleAvatarChange} />
              </div>

              <div>
                <h2 style={{ color: "#e0e0e0", margin: "0 0 6px", fontSize: "22px", fontWeight: "600" }}>{username}</h2>
                <p style={{ color: "#555", fontSize: "13px", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => setSocialModal("followers")}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, fontSize: "13px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                  >
                    {t("userProfile.follower", { count: followers.length })}
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setSocialModal("following")}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, fontSize: "13px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                  >
                    {following.length} {t("userProfile.followingCount")}
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
                {followLoading ? "..." : isFollowing ? t("userProfile.unfollow") : t("userProfile.follow")}
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color: "#444", fontSize: "13px" }}>{t("common.loading")}</p>
          ) : Object.keys(groupedSubjects).length === 0 ? (
            <p style={{ color: "#444", fontSize: "14px" }}>{t("userProfile.noPosts")}</p>
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
