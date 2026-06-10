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

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("micelio_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers, redirect: "manual" });
  // Spring Security redireciona para /oauth2/authorization/google em vez de retornar 401.
  // redirect:"manual" impede o browser de seguir o redirect; convertemos para 401 explícito.
  if (res.type === "opaqueredirect") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return res;
};

// For multipart/form-data — do NOT set Content-Type, browser adds boundary automatically
export const authFetchMultipart = (url, formData) => {
  const token = localStorage.getItem("micelio_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { method: "POST", headers, body: formData });
};
