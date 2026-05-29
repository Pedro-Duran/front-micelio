import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { navigate("/login"); return; }

    const payload = parseJwt(token);
    const username = payload?.sub;

    if (username) {
      login(token, username);
      navigate("/");
    } else {
      navigate("/login");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ background: "#1e1e1e", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888", fontSize: "14px" }}>Autenticando...</p>
    </div>
  );
}

export default OAuth2CallbackPage;
