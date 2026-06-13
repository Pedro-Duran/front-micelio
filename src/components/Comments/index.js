import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../utils/api";
import { useTranslation } from "react-i18next";

function timeAgo(iso, t) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return t("common.now");
  const m = Math.floor(s / 60);
  if (m < 60) return t("common.minutesAgo", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("common.hoursAgo", { count: h });
  const d = Math.floor(h / 24);
  if (d < 7) return t("common.daysAgo", { count: d });
  return new Date(iso).toLocaleDateString();
}

const inputStyle = {
  flex: 1,
  background: "#242424",
  border: "1px solid #333",
  borderRadius: "4px",
  padding: "8px 12px",
  color: "#e0e0e0",
  fontSize: "14px",
};

function LoginModal({ onClose, onSuccess }) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 401) { setError(t("comments.wrongCredentials")); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      login(data.token, data.username);
      onSuccess();
    } catch {
      setError(t("comments.serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#2a2a2a", borderRadius: "8px", padding: "32px 40px", width: "300px", display: "flex", flexDirection: "column", gap: "14px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>{t("comments.loginToComment")}</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            placeholder={t("auth.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            style={{ ...inputStyle, background: "#1e1e1e" }}
          />
          <input
            type="password"
            placeholder={t("auth.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ ...inputStyle, background: "#1e1e1e" }}
          />
          {error && <p style={{ color: "#f44336", fontSize: "13px", margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px", fontSize: "14px", fontWeight: "bold", cursor: loading ? "default" : "pointer" }}
          >
            {loading ? t("comments.logging") : t("comments.login")}
          </button>
        </form>
      </div>
    </div>
  );
}

function CommentItem({ comment, postId, currentUsername, onDelete, onRefresh, depth }) {
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [displayContent, setDisplayContent] = useState(comment.content);

  const canEdit = currentUsername && currentUsername === comment.authorUsername;
  const canDelete = canEdit;
  const maxDepthIndent = Math.min(depth, 4);

  const submitEdit = async () => {
    if (!editContent.trim() || editContent === displayContent) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await authFetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setDisplayContent(updated.content);
      setEditing(false);
    } catch {
      alert(t("comments.editError"));
    } finally {
      setSaving(false);
    }
  };

  const submitReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/comments/${comment.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content: replyContent }),
      });
      if (!res.ok) throw new Error();
      setReplyContent("");
      setReplying(false);
      onRefresh();
    } catch {
      alert(t("comments.replyError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyClick = () => {
    if (!isLoggedIn) { setShowModal(true); return; }
    setReplying((r) => !r);
  };

  return (
    <div
      style={{
        marginLeft: maxDepthIndent * 20,
        borderLeft: depth > 0 ? "2px solid #2a2a2a" : "none",
        paddingLeft: depth > 0 ? "16px" : 0,
      }}
    >
      {showModal && (
        <LoginModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setReplying(true); }}
        />
      )}

      <div style={{ padding: "12px 0", borderBottom: "1px solid #242424" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ color: "#e0e0e0", fontSize: "13px", fontWeight: "500" }}>
            {comment.authorUsername}
          </span>
          <span style={{ color: "#444", fontSize: "11px" }}>{timeAgo(comment.createdAt, t)}</span>
        </div>
        {editing ? (
          <div style={{ marginBottom: "8px" }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              rows={3}
              style={{ ...inputStyle, width: "100%", resize: "vertical", boxSizing: "border-box" }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); } }}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <button
                onClick={submitEdit}
                disabled={saving || !editContent.trim()}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "6px 14px", fontSize: "12px", fontWeight: "bold", cursor: saving || !editContent.trim() ? "default" : "pointer" }}
              >
                {saving ? "..." : t("common.save")}
              </button>
              <button
                onClick={() => { setEditing(false); setEditContent(displayContent); }}
                style={{ background: "none", border: "1px solid #333", borderRadius: "4px", padding: "6px 10px", color: "#666", fontSize: "12px", cursor: "pointer" }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: "#bbb", fontSize: "14px", lineHeight: "1.6", margin: "0 0 8px" }}>
            {displayContent}
          </p>
        )}
        <div style={{ display: "flex", gap: "14px" }}>
          <button
            onClick={handleReplyClick}
            style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#aaa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
          >
            {t("comments.reply")}
          </button>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", padding: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#aaa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
            >
              {t("common.edit")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", padding: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f44336"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
            >
              {t("common.delete")}
            </button>
          )}
        </div>

        {replying && (
          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
            <input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={t("comments.replyPlaceholder")}
              autoFocus
              style={inputStyle}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submitReply(); }}
            />
            <button
              onClick={submitReply}
              disabled={submitting || !replyContent.trim()}
              style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "8px 14px", fontSize: "13px", fontWeight: "bold", cursor: submitting || !replyContent.trim() ? "default" : "pointer" }}
            >
              {submitting ? "..." : t("comments.reply")}
            </button>
            <button
              onClick={() => { setReplying(false); setReplyContent(""); }}
              style={{ background: "none", border: "1px solid #333", borderRadius: "4px", padding: "8px 10px", color: "#666", fontSize: "12px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          currentUsername={currentUsername}
          onDelete={onDelete}
          onRefresh={onRefresh}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function Comments({ postId, onCountChange }) {
  const { isLoggedIn, username } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingComment, setPendingComment] = useState("");

  const fetchComments = useCallback(() => {
    fetch(`/api/comments/byPost?postId=${postId}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then(setComments);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async (content) => {
    setSubmitting(true);
    try {
      const res = await authFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) throw new Error();
      setNewComment("");
      fetchComments();
    } catch {
      alert(t("comments.sendError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    if (!isLoggedIn) {
      setPendingComment(newComment);
      setShowModal(true);
      return;
    }
    submitComment(newComment);
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm(t("comments.deleteConfirm"))) return;
    try {
      const res = await authFetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchComments();
    } catch {
      alert(t("comments.deleteError"));
    }
  };

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  useEffect(() => { onCountChange?.(totalCount); }, [totalCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "1px solid #2a2a2a" }}>
      {showModal && (
        <LoginModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            if (pendingComment) { submitComment(pendingComment); setPendingComment(""); }
          }}
        />
      )}

      <h4 style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 20px" }}>
        {totalCount > 0 ? `${totalCount} comentário${totalCount !== 1 ? "s" : ""}` : "Comentários"}
      </h4>

      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isLoggedIn ? t("comments.commentPlaceholder") : t("comments.loginPlaceholder")}
          style={inputStyle}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit(); }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
          style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "14px", fontWeight: "bold", cursor: submitting || !newComment.trim() ? "default" : "pointer" }}
        >
          {submitting ? "..." : t("comments.comment")}
        </button>
      </div>

      {comments.length === 0 ? (
        <p style={{ color: "#444", fontSize: "14px" }}>{t("comments.noComments")}</p>
      ) : (
        <div>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              currentUsername={username}
              onDelete={handleDelete}
              onRefresh={fetchComments}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comments;
