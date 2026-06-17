import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authFetch } from "../utils/api";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchCount = useCallback(() => {
    if (!isLoggedIn) return;
    authFetch("/api/notifications/unread-count")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => { if (data != null) setUnreadCount(data.count ?? 0); });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) { setUnreadCount(0); return; }
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [isLoggedIn, fetchCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, setUnreadCount, refresh: fetchCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
