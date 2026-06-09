import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Cabecalho from "../Cabecalho";
import { useTranslation } from "react-i18next";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { t } = useTranslation();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError(t("resetPassword.passwordMismatch")); return; }
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (res.status === 400) { setError(t("resetPassword.expiredLink")); return; }
      if (!res.ok) throw new Error();

      let data = null;
      try { data = await res.json(); } catch {}
      if (data?.token && data?.username) {
        login(data.token, data.username);
        navigate("/");
      } else {
        setDone(true);
      }
    } catch {
      setError(t("resetPassword.serverError"));
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
              <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>{t("resetPassword.invalidLink")}</h3>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{t("resetPassword.invalidLinkDesc")}</p>
              <button onClick={() => navigate("/login")} style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                {t("resetPassword.backToLogin")}
              </button>
            </>
          ) : done ? (
            <>
              <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>{t("resetPassword.passwordReset")}</h3>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{t("resetPassword.passwordResetDesc")}</p>
              <button onClick={() => navigate("/login")} style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                {t("resetPassword.goToLogin")}
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ color: "#e0e0e0", margin: 0, fontSize: "15px" }}>{t("resetPassword.createNewPassword")}</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#888", fontSize: "12px" }}>{t("resetPassword.newPassword")}</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" style={inputStyle} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "#888", fontSize: "12px" }}>{t("resetPassword.confirmPassword")}</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" style={inputStyle} />
              </div>

              {error && <p style={{ color: "#f44336", fontSize: "13px", margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px", fontSize: "14px", fontWeight: "bold", cursor: isLoading ? "default" : "pointer" }}
              >
                {isLoading ? t("resetPassword.saving") : t("resetPassword.savePassword")}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;
