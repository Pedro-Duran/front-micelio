import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Cabecalho from "../Cabecalho";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError("As senhas não coincidem."); return; }
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (res.status === 400) { setError("Link inválido ou expirado. Solicite um novo."); return; }
      if (!res.ok) throw new Error();

      // Se o backend retornar { token, username }, faz login automático
      let data = null;
      try { data = await res.json(); } catch {}
      if (data?.token && data?.username) {
        login(data.token, data.username);
        navigate("/");
      } else {
        setDone(true);
      }
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = { background: "#1e1e1e", border: "1px solid #444", borderRadius: "4px", padding: "8px 12px", color: "#e0e0e0", fontSize: "14px" };

  return (
    <>
      <Cabecalho />
      <div style={{ background: "#1e1e1e", minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#2a2a2a", padding: "40px 48px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {!token ? (
            <>
              <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>Link inválido</h3>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>O link de redefinição não contém um token válido.</p>
              <button onClick={() => navigate("/login")} style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                Voltar ao login
              </button>
            </>
          ) : done ? (
            <>
              <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>Senha redefinida</h3>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>Sua nova senha foi salva. Você já pode fazer login.</p>
              <button onClick={() => navigate("/login")} style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                Ir para o login
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>Criar nova senha</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#888", fontSize: "12px" }}>Nova senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" style={inputStyle} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#888", fontSize: "12px" }}>Confirmar senha</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" style={inputStyle} />
              </div>

              {error && <p style={{ color: "#f44336", fontSize: "13px", margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: isLoading ? "default" : "pointer" }}
              >
                {isLoading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;
