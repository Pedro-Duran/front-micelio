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

export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("micelio_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
};

// For multipart/form-data — do NOT set Content-Type, browser adds boundary automatically
export const authFetchMultipart = (url, formData) => {
  const token = localStorage.getItem("micelio_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { method: "POST", headers, body: formData });
};
