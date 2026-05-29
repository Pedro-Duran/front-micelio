import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import SubjectsSidebar from "../SubjectsSidebar";
import SubjectCard from "../SubjectCard";
import { authFetch, parsePage } from "../../utils/api";

function groupBySubject(posts) {
  const groups = {};
  posts.forEach((p) => {
    const subj = p.subject || "Sem categoria";
    if (!groups[subj]) groups[subj] = { nodes: [], links: [] };
    groups[subj].nodes.push({
      id: p.id,
      title: p.title || "Sem título",
      content: p.content || "",
      isStub: p.isStub || false,
      viewCount: 0,
    });
  });
  posts.forEach((p) => {
    if (!Array.isArray(p.links)) return;
    const subj = p.subject || "Sem categoria";
    const ids = new Set(groups[subj].nodes.map((n) => n.id));
    p.links.forEach((linkedId) => {
      if (ids.has(linkedId)) groups[subj].links.push({ source: p.id, target: linkedId });
    });
  });
  return groups;
}

function FeedPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("explore");
  const [groupedSubjects, setGroupedSubjects] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGroupedSubjects({});
    setLoading(true);
    const endpoint =
      tab === "feed"
        ? `/api/posts/feed?page=0&size=200`
        : `/api/posts/explore?page=0&size=200`;

    authFetch(endpoint)
      .then((r) => (r.ok ? r.json() : { content: [] }))
      .catch(() => ({ content: [] }))
      .then((raw) => {
        setGroupedSubjects(groupBySubject(parsePage(raw).content));
        setLoading(false);
      });
  }, [tab]);

  const isEmpty = !loading && Object.keys(groupedSubjects).length === 0;

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div style={{ flex: 1, padding: "32px 32px", overflowY: "auto" }}>

          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: "28px", borderBottom: "1px solid #2a2a2a" }}>
            {[
              { key: "feed", label: "Seguindo" },
              { key: "explore", label: "Explorar" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px 18px",
                  color: tab === key ? "#4fc3f7" : "#555",
                  fontSize: "13px",
                  fontWeight: tab === key ? "600" : "400",
                  cursor: "pointer",
                  borderBottom: tab === key ? "2px solid #4fc3f7" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <p style={{ color: "#444", fontSize: "13px" }}>Carregando...</p>
          )}

          {/* Empty feed CTA */}
          {isEmpty && tab === "feed" && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "#555", fontSize: "15px", marginBottom: "16px" }}>
                Você ainda não segue ninguém.
              </p>
              <button
                onClick={() => setTab("explore")}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px 22px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
              >
                Explorar posts
              </button>
            </div>
          )}

          {isEmpty && tab === "explore" && (
            <p style={{ color: "#444", fontSize: "14px" }}>Nenhum post encontrado.</p>
          )}

          {/* Subject cards */}
          {!loading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignContent: "flex-start" }}>
              {Object.entries(groupedSubjects).map(([subject, { nodes, links }]) => (
                <SubjectCard
                  key={subject}
                  subject={subject}
                  nodes={nodes}
                  links={links}
                  onNodeClick={(node) => navigate(`/post/${node.id}`)}
                  overlay
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default FeedPage;
