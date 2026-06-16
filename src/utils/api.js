// Handles both PageImpl (legacy) and VIA_DTO formats
export const parsePage = (data) => {
  const content = Array.isArray(data) ? data : (data.content ?? []);
  // VIA_DTO: { content, page: { number, totalPages } }
  // Legacy:  { content, last: bool }
  let isLast;
  if (data.page != null) {
    isLast = data.page.number >= data.page.totalPages - 1;
  } else {
    isLast = data.last ?? true;
  }
  return { content, isLast };
};

const ACCESS_TOKEN_KEY = "micelio_token";
const REFRESH_TOKEN_KEY = "micelio_refresh_token";
const USERNAME_KEY = "micelio_username";

let refreshPromise = null;

const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

const isAuthEndpoint = (url) => url.startsWith("/api/auth/");

const toUnauthorizedResponse = () =>
  new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });

// Garante que múltiplas chamadas 401 simultâneas disparem só um refresh.
const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        return data.accessToken;
      } catch {
        return null;
      }
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

// Se o access token expirou, tenta renovar com o refresh token e repete a chamada
// uma única vez. Se o refresh também falhar, a sessão é definitivamente inválida.
const handleUnauthorized = async (retry) => {
  const newToken = await refreshAccessToken();
  if (newToken) return retry();
  clearSession();
  window.location.href = "/login";
  return toUnauthorizedResponse();
};

export const authFetch = async (url, options = {}, _retried = false) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = { ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers, redirect: "manual" });

  // Spring Security redireciona para /oauth2/authorization/google em vez de retornar 401.
  // redirect:"manual" impede o browser de seguir o redirect; convertemos para 401 explícito.
  const unauthorized = res.type === "opaqueredirect" || res.status === 401;
  if (unauthorized && !_retried && !isAuthEndpoint(url)) {
    return handleUnauthorized(() => authFetch(url, options, true));
  }
  if (res.type === "opaqueredirect") return toUnauthorizedResponse();
  return res;
};

// For multipart/form-data — do NOT set Content-Type, browser adds boundary automatically
export const authFetchMultipart = async (url, formData, _retried = false) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: formData, redirect: "manual" });

  const unauthorized = res.type === "opaqueredirect" || res.status === 401;
  if (unauthorized && !_retried) {
    return handleUnauthorized(() => authFetchMultipart(url, formData, true));
  }
  if (res.type === "opaqueredirect") return toUnauthorizedResponse();
  return res;
};
