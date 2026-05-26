import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../utils/api";

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
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
      if (res.status === 401) { setError("Usuário ou senha incorretos."); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      login(data.token, data.username);
      onSuccess();
    } catch {
      setError("Não foi possível conectar ao servidor.");
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
        <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>Entre para comentar</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            style={{ ...inputStyle, background: "#1e1e1e" }}
          />
          <input
            type="password"
            placeholder="Senha"
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
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CommentItem({ comment, postId, currentUsername, onDelete, onRefresh, depth }) {
  const { isLoggedIn } = useAuth();
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const canDelete = currentUsername && currentUsername === comment.authorUsername;
  const maxDepthIndent = Math.min(depth, 4);

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
      alert("Erro ao enviar resposta.");
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
          <span style={{ color: "#444", fontSize: "11px" }}>{timeAgo(comment.createdAt)}</span>
        </div>
        <p style={{ color: "#bbb", fontSize: "14px", lineHeight: "1.6", margin: "0 0 8px" }}>
          {comment.content}
        </p>
        <div style={{ display: "flex", gap: "14px" }}>
          <button
            onClick={handleReplyClick}
            style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#aaa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
          >
            Responder
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", padding: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f44336"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
            >
              Deletar
            </button>
          )}
        </div>

        {replying && (
          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
            <input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Sua resposta..."
              autoFocus
              style={inputStyle}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submitReply(); }}
            />
            <button
              onClick={submitReply}
              disabled={submitting || !replyContent.trim()}
              style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "8px 14px", fontSize: "13px", fontWeight: "bold", cursor: submitting || !replyContent.trim() ? "default" : "pointer" }}
            >
              {submitting ? "..." : "Responder"}
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

function Comments({ postId }) {
  const { isLoggedIn, username } = useAuth();
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
      alert("Erro ao enviar comentário.");
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
    if (!window.confirm("Deletar comentário?")) return;
    try {
      const res = await authFetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchComments();
    } catch {
      alert("Erro ao deletar comentário.");
    }
  };

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

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

      {/* Formulário */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isLoggedIn ? "Escreva um comentário..." : "Entre para comentar..."}
          style={inputStyle}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit(); }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
          style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "14px", fontWeight: "bold", cursor: submitting || !newComment.trim() ? "default" : "pointer" }}
        >
          {submitting ? "..." : "Comentar"}
        </button>
      </div>

      {/* Lista */}
      {comments.length === 0 ? (
        <p style={{ color: "#444", fontSize: "14px" }}>Nenhum comentário ainda.</p>
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
