import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("micelio_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("micelio_username"));

  const login = (newToken, newRefreshToken, newUsername) => {
    localStorage.setItem("micelio_token", newToken);
    if (newRefreshToken) localStorage.setItem("micelio_refresh_token", newRefreshToken);
    localStorage.setItem("micelio_username", newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("micelio_refresh_token");
    if (refreshToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("micelio_token");
    localStorage.removeItem("micelio_refresh_token");
    localStorage.removeItem("micelio_username");
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
