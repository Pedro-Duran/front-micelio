import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Cabecalho from "../Cabecalho";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reset = (nextMode) => {
    setUsername("");
    setPassword("");
    setError("");
    setMode(nextMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/users/createUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (res.status === 400) {
          setError("Nome de usuário já existe.");
          return;
        }
        if (!res.ok) throw new Error();
      }

      // Login (both after register and direct login)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 401) {
        setError("Usuário ou senha incorretos.");
        return;
      }
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

  const isRegister = mode === "register";

  return (
    <>
      <Cabecalho />
      <div
        style={{
          background: "#1e1e1e",
          minHeight: "calc(100vh - 60px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#2a2a2a",
            padding: "40px 48px",
            borderRadius: "8px",
            width: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Toggle login / register */}
          <div style={{ display: "flex", borderBottom: "1px solid #3a3a3a", marginBottom: "4px" }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => reset(m)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  borderBottom: mode === m ? "2px solid #4fc3f7" : "2px solid transparent",
                  color: mode === m ? "#4fc3f7" : "#666",
                  cursor: "pointer",
                  padding: "8px 0",
                  fontSize: "14px",
                  fontWeight: mode === m ? "bold" : "normal",
                  marginBottom: "-1px",
                }}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#888", fontSize: "12px" }}>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{ background: "#1e1e1e", border: "1px solid #444", borderRadius: "4px", padding: "8px 12px", color: "#e0e0e0", fontSize: "14px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#888", fontSize: "12px" }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              style={{ background: "#1e1e1e", border: "1px solid #444", borderRadius: "4px", padding: "8px 12px", color: "#e0e0e0", fontSize: "14px" }}
            />
          </div>

          {error && (
            <p style={{ color: "#f44336", fontSize: "13px", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: "#4fc3f7",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              padding: "10px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: isLoading ? "default" : "pointer",
            }}
          >
            {isLoading
              ? isRegister ? "Criando conta..." : "Entrando..."
              : isRegister ? "Criar conta e entrar" : "Entrar"}
          </button>
        </form>
      </div>
    </>
  );
}

export default Login;
