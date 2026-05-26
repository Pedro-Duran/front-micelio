import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import { authFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function UsersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, username: currentUser } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  // Set of usernames the current user already follows
  const [followingSet, setFollowingSet] = useState(new Set());
  const [loadingFollow, setLoadingFollow] = useState(new Set());

  // Fetch users whenever URL param changes
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setLoading(true);

    const url = q
      ? `/api/users/search?username=${encodeURIComponent(q)}`
      : `/api/users/search`;

    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.content ?? []);
        setUsers(list);
        setLoading(false);
      });
  }, [searchParams]);

  // Fetch who the current user follows (single call, derive follow state locally)
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    fetch(`/api/users/${currentUser}/following`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.content ?? []);
        setFollowingSet(new Set(list.map((u) => u.username)));
      });
  }, [isLoggedIn, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/users?q=${encodeURIComponent(q)}` : "/users");
  };

  const handleFollow = async (targetUsername) => {
    setLoadingFollow((prev) => new Set(prev).add(targetUsername));
    const isFollowing = followingSet.has(targetUsername);
    try {
      const res = await authFetch(`/api/users/${targetUsername}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
      setFollowingSet((prev) => {
        const next = new Set(prev);
        isFollowing ? next.delete(targetUsername) : next.add(targetUsername);
        return next;
      });
    } catch {
      // silently ignore
    } finally {
      setLoadingFollow((prev) => {
        const next = new Set(prev);
        next.delete(targetUsername);
        return next;
      });
    }
  };

  const initialQ = searchParams.get("q") || "";

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, maxWidth: "600px", margin: "0 auto", padding: "32px 24px" }}>

          {/* Search bar */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", marginBottom: "32px", border: "1px solid #333", borderRadius: "6px", overflow: "hidden" }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar usuário..."
              autoFocus
              style={{ flex: 1, background: "transparent", border: "none", padding: "10px 14px", color: "#e0e0e0", fontSize: "14px", outline: "none" }}
            />
            <button
              type="submit"
              onMouseEnter={(e) => { e.currentTarget.style.color = "#999"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
              style={{ background: "transparent", border: "none", padding: "10px 14px", color: "#555", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="6.5" cy="6.5" r="4" />
                <line x1="9.5" y1="9.5" x2="13" y2="13" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          {/* Results */}
          {loading ? (
            <p style={{ color: "#444", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>Carregando...</p>
          ) : users.length === 0 ? (
            <p style={{ color: "#444", fontSize: "14px", textAlign: "center", padding: "48px 0" }}>
              {initialQ ? `Nenhum usuário encontrado para "${initialQ}".` : "Nenhum usuário encontrado."}
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              {users.map((user) => {
                const isFollowing = followingSet.has(user.username);
                const isLoading = loadingFollow.has(user.username);
                const isOwn = currentUser === user.username;
                return (
                  <li
                    key={user.id ?? user.username}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "6px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#242424"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Link
                      to={`/user/${user.username}`}
                      style={{ color: "#e0e0e0", fontSize: "14px", textDecoration: "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#e0e0e0"; }}
                    >
                      {user.username}
                    </Link>
                    {isLoggedIn && !isOwn && (
                      <button
                        onClick={() => handleFollow(user.username)}
                        disabled={isLoading}
                        onMouseEnter={(e) => { if (!isFollowing) e.currentTarget.style.background = "#81d4fa"; }}
                        onMouseLeave={(e) => { if (!isFollowing) e.currentTarget.style.background = "#4fc3f7"; }}
                        style={{
                          background: isFollowing ? "none" : "#4fc3f7",
                          border: isFollowing ? "1px solid #444" : "none",
                          borderRadius: "4px",
                          color: isFollowing ? "#888" : "#000",
                          cursor: isLoading ? "default" : "pointer",
                          padding: "5px 14px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          flexShrink: 0,
                        }}
                      >
                        {isLoading ? "..." : isFollowing ? "Seguindo" : "Seguir"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

        </div>
      </div>
    </>
  );
}

export default UsersPage;
