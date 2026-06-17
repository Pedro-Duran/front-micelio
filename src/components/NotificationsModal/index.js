import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../utils/api";
import { useNotifications } from "../../context/NotificationsContext";
import Avatar from "../Avatar";

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function notificationText(n) {
  switch (n.type) {
    case "COMMENT": return { prefix: n.actorUsername, suffix: ` comentou em "${n.postTitle}"` };
    case "LIKE": return { prefix: n.actorUsername, suffix: ` curtiu "${n.postTitle}"` };
    case "FOLLOW": return { prefix: n.actorUsername, suffix: " começou a te seguir" };
    case "STUB_SUBSCRIBED": return { prefix: n.actorUsername, suffix: ` se inscreveu em "${n.postTitle}"` };
    case "STUB_PUBLISHED": return { prefix: n.actorUsername, suffix: ` publicou "${n.postTitle}"` };
    default: return { prefix: n.actorUsername, suffix: " interagiu com você" };
  }
}

function NotificationsModal({ onClose }) {
  const navigate = useNavigate();
  const { setUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, append = false) => {
    if (p === 0) setLoading(true); else setLoadingMore(true);
    try {
      const res = await authFetch(`/api/notifications?page=${p}&size=20`);
      if (res.ok) {
        const data = await res.json();
        const items = data.content ?? [];
        const isLast = data.last ?? (data.number >= data.totalPages - 1) ?? true;
        setNotifications((prev) => append ? [...prev, ...items] : items);
        setHasMore(!isLast);
        setPage(p);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const markOne = (id) => {
    authFetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAll = async () => {
    await authFetch("/api/notifications/read-all", { method: "PATCH" }).catch(() => {});
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnreadCount(0);
  };

  const handleClick = (n) => {
    if (!n.readAt) markOne(n.id);
    if (n.postId) { navigate(`/post/${n.postId}`); onClose(); }
  };

  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        paddingTop: "52px",
        paddingRight: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#141414",
          border: "1px solid #2a2a2a",
          borderRadius: "10px",
          width: "420px",
          maxHeight: "76vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: "1px solid #1e1e1e",
          flexShrink: 0,
        }}>
          <span style={{ color: "#e0e0e0", fontSize: "14px", fontWeight: "600" }}>Notificações</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {hasUnread && (
              <button
                onClick={markAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "#4fc3f7",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#81d4fa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px 4px" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#aaa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
            >
              ×
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#555", fontSize: "13px" }}>
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#444", fontSize: "13px" }}>
              Nenhuma notificação ainda.
            </div>
          ) : (
            <>
              {notifications.map((n) => {
                const { prefix, suffix } = notificationText(n);
                const unread = !n.readAt;
                const clickable = !!n.postId;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "11px 16px",
                      borderBottom: "1px solid #1a1a1a",
                      background: unread ? "rgba(79,195,247,0.05)" : "transparent",
                      cursor: clickable ? "pointer" : "default",
                      transition: "background 0.1s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => { if (clickable) e.currentTarget.style.background = unread ? "rgba(79,195,247,0.1)" : "#1a1a1a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = unread ? "rgba(79,195,247,0.05)" : "transparent"; }}
                  >
                    {/* Unread indicator */}
                    {unread && (
                      <span style={{
                        position: "absolute",
                        left: "5px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "#4fc3f7",
                        flexShrink: 0,
                      }} />
                    )}

                    <Avatar
                      avatarUrl={n.actorAvatarUrl ?? null}
                      username={n.actorUsername}
                      size={34}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "#bbb", lineHeight: "1.45" }}>
                        <span style={{ color: "#e0e0e0", fontWeight: "500" }}>{prefix}</span>
                        <span>{suffix}</span>
                      </p>
                      <span style={{ fontSize: "11px", color: "#444", marginTop: "3px", display: "block" }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div style={{ padding: "12px", textAlign: "center" }}>
                  <button
                    onClick={() => load(page + 1, true)}
                    disabled={loadingMore}
                    style={{
                      background: "none",
                      border: "1px solid #2a2a2a",
                      borderRadius: "5px",
                      color: loadingMore ? "#444" : "#666",
                      fontSize: "12px",
                      padding: "6px 16px",
                      cursor: loadingMore ? "default" : "pointer",
                    }}
                    onMouseEnter={(e) => { if (!loadingMore) e.currentTarget.style.color = "#aaa"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = loadingMore ? "#444" : "#666"; }}
                  >
                    {loadingMore ? "Carregando..." : "Carregar mais"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;
