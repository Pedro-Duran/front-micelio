import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Cabecalho from "../Cabecalho";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const reset = (nextMode) => {
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
    setForgotSent(false);
    setMode(nextMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "register") {
        const body = { username, password, email: email.trim() };
        const res = await fetch("/api/users/createUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 400) { setError("Nome de usuário já existe."); return; }
        if (!res.ok) throw new Error();
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 401) { setError("Usuário ou senha incorretos."); return; }
      if (!res.ok) throw new Error();

      const data = await res.json();
      login(data.token, data.username);
      navigate("/");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setForgotSent(true);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const isRegister = mode === "register";

  const inputStyle = { background: "#1e1e1e", border: "1px solid #444", borderRadius: "4px", padding: "8px 12px", color: "#e0e0e0", fontSize: "14px" };

  return (
    <>
      <Cabecalho />
      <div style={{ background: "#1e1e1e", minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {mode === "forgot" ? (
          <div style={{ background: "#2a2a2a", padding: "40px 48px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <button
              type="button"
              onClick={() => reset("login")}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "12px", textAlign: "left", padding: 0 }}
            >
              ← Voltar ao login
            </button>

            {forgotSent ? (
              <>
                <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>Email enviado</h3>
                <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                  Se esse endereço estiver cadastrado, você receberá um link para redefinir sua senha.
                </p>
                <button
                  onClick={() => reset("login")}
                  style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
                >
                  Voltar ao login
                </button>
              </>
            ) : (
              <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h3 style={{ color: "#e0e0e0", margin: "0 0 4px", fontSize: "15px" }}>Esqueceu sua senha?</h3>
                  <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>Informe o email da sua conta.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#888", fontSize: "12px" }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                </div>
                {error && <p style={{ color: "#f44336", fontSize: "13px", margin: 0 }}>{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: isLoading ? "default" : "pointer" }}
                >
                  {isLoading ? "Enviando..." : "Enviar link"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ background: "#2a2a2a", padding: "40px 48px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ display: "flex", borderBottom: "1px solid #3a3a3a", marginBottom: "4px" }}>
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => reset(m)}
                  style={{
                    flex: 1, background: "none", border: "none",
                    borderBottom: mode === m ? "2px solid #4fc3f7" : "2px solid transparent",
                    color: mode === m ? "#4fc3f7" : "#666",
                    cursor: "pointer", padding: "8px 0", fontSize: "14px",
                    fontWeight: mode === m ? "bold" : "normal", marginBottom: "-1px",
                  }}
                >
                  {m === "login" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "#888", fontSize: "12px" }}>Usuário</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" style={inputStyle} />
            </div>

            {isRegister && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#888", fontSize: "12px" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "#888", fontSize: "12px" }}>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isRegister ? "new-password" : "current-password"} style={inputStyle} />
            </div>

            {error && <p style={{ color: "#f44336", fontSize: "13px", margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: isLoading ? "default" : "pointer" }}
            >
              {isLoading
                ? isRegister ? "Criando conta..." : "Entrando..."
                : isRegister ? "Criar conta e entrar" : "Entrar"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#333" }} />
              <span style={{ color: "#555", fontSize: "11px" }}>ou</span>
              <div style={{ flex: 1, height: "1px", background: "#333" }} />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${process.env.REACT_APP_API_URL || "http://localhost:8080"}/oauth2/authorization/google`; }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "#fff", color: "#333", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Entrar com Google
            </button>

            {!isRegister && (
              <button
                type="button"
                onClick={() => reset("forgot")}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "12px", padding: 0, textAlign: "center" }}
              >
                Esqueceu sua senha?
              </button>
            )}
          </form>
        )}

      </div>
    </>
  );
}

export default Login;
