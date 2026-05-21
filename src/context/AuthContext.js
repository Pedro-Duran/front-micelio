import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("micelio_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("micelio_username"));

  const login = (newToken, newUsername) => {
    localStorage.setItem("micelio_token", newToken);
    localStorage.setItem("micelio_username", newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem("micelio_token");
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
