export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("micelio_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
};
