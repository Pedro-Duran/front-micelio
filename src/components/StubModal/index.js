import React, { useState } from "react";
import { authFetch } from "../../utils/api";

function StubModal({ postId, postTitle, onClose }) {
  const [step, setStep] = useState("ask");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNotify = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`/api/posts/${postId}/notify`, { method: "POST" });
      if (!res.ok) throw new Error();
      setStep("done");
    } catch {
      setError("Não foi possível registrar. Verifique se está logado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#2a2a2a", border: "1px solid #333", borderRadius: "10px", padding: "28px 32px", maxWidth: "360px", width: "90%", display: "flex", flexDirection: "column", gap: "14px" }}
      >
        {step === "ask" ? (
          <>
            <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px", fontWeight: "600" }}>
              Post não escrito ainda
            </h3>
            <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              <span style={{ color: "#ccc" }}>"{postTitle}"</span> ainda não foi escrito.
              Deseja receber uma notificação quando for publicado?
            </p>
            {error && <p style={{ color: "#f44336", fontSize: "12px", margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={handleNotify}
                disabled={loading}
                style={{ flex: 1, background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px", fontSize: "13px", fontWeight: "bold", cursor: loading ? "default" : "pointer" }}
              >
                {loading ? "..." : "Sim, me avise"}
              </button>
              <button
                onClick={onClose}
                style={{ flex: 1, background: "none", border: "1px solid #444", borderRadius: "4px", padding: "9px", fontSize: "13px", color: "#888", cursor: "pointer" }}
              >
                Não
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px", fontWeight: "600" }}>Tudo certo!</h3>
            <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              Você será notificado quando esse post for publicado.
            </p>
            <button
              onClick={onClose}
              style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default StubModal;
