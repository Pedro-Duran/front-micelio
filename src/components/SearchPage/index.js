import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import { parsePage } from "../../utils/api";
import { useTranslation } from "react-i18next";

function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "posts";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setResults([]);
    setLoading(true);

    if (type === "posts") {
      fetch(`/api/posts/search?title=${encodeURIComponent(q)}&page=0&size=50`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}))
        .then((raw) => {
          setResults(parsePage(raw).content);
          setLoading(false);
        });
    } else {
      fetch("/api/posts/verPosts?page=0&size=1000")
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}))
        .then((raw) => {
          const posts = parsePage(raw).content;
          const subjects = [...new Set(
            posts
              .map((p) => p.subject)
              .filter(Boolean)
              .filter((s) => s.toLowerCase().includes(q.toLowerCase()))
          )].sort();
          setResults(subjects.map((s) => ({ name: s })));
          setLoading(false);
        });
    }
  }, [q, type]);

  const switchType = (newType) => navigate(`/search?q=${encodeURIComponent(q)}&type=${newType}`);

  const tabs = [
    { key: "posts", label: t("search.posts") },
    { key: "subjects", label: t("search.subjects") },
  ];

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>

          <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", marginBottom: "24px" }}>
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchType(key)}
                style={{
                  background: "none", border: "none", padding: "8px 18px",
                  color: type === key ? "#4fc3f7" : "#555",
                  fontSize: "13px", fontWeight: type === key ? "600" : "400",
                  cursor: "pointer",
                  borderBottom: type === key ? "2px solid #4fc3f7" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {q && (
            <p style={{ color: "#555", fontSize: "12px", marginBottom: "16px" }}>
              {t("search.resultsFor")} <span style={{ color: "#888" }}>"{q}"</span>
            </p>
          )}

          {loading && <p style={{ color: "#444", fontSize: "13px" }}>{t("search.searching")}</p>}

          {!loading && results.length === 0 && q && (
            <p style={{ color: "#444", fontSize: "13px" }}>{t("search.noResults")}</p>
          )}

          {type === "posts" && !loading && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
              {results.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/post/${post.id}`}
                    style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "2px", padding: "12px 14px", borderRadius: "6px", background: "#242424", border: "1px solid #2e2e2e" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3a3a3a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2e2e2e"; }}
                  >
                    <span style={{ color: "#e0e0e0", fontSize: "14px", fontWeight: "500" }}>{post.title}</span>
                    <span style={{ color: "#555", fontSize: "12px" }}>
                      {post.subject && <span style={{ color: "#4fc3f7", marginRight: "8px" }}>{post.subject}</span>}
                      {post.authorUsername || post.author?.username}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {type === "subjects" && !loading && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
              {results.map(({ name }) => (
                <li key={name}>
                  <Link
                    to={`/subject/${encodeURIComponent(name)}`}
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", padding: "12px 14px", borderRadius: "6px", background: "#242424", border: "1px solid #2e2e2e", color: "#e0e0e0", fontSize: "14px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; e.currentTarget.style.borderColor = "#3a3a3a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#e0e0e0"; e.currentTarget.style.borderColor = "#2e2e2e"; }}
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

        </div>
      </div>
    </>
  );
}

export default SearchPage;
