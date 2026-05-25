import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "./components/Cabecalho";

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [groupedNodes, setGroupedNodes] = useState({});
  const [activeSubject, setActiveSubject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch("/api/posts/verPosts").then((r) => {
        if (!r.ok) throw new Error("Erro ao buscar posts");
        return r.json();
      }),
      fetch("/api/events/summary").then((r) => r.json()).catch(() => []),
    ]).then(([postsData, summaryData]) => {
      const vcMap = {};
      summaryData.forEach((s) => { vcMap[s.postId] = s.viewCount || 0; });

      const nodes = postsData.map((post) => ({
        id: post.id,
        title: post.title || "Título não disponível",
        subject: post.subject || "Sem categoria",
        isStub: post.isStub || false,
        viewCount: vcMap[post.id] || 0,
      }));

      const links = [];
      postsData.forEach((post) => {
        if (Array.isArray(post.links)) {
          post.links.forEach((linkedId) => {
            links.push({ source: post.id, target: linkedId });
          });
        }
      });

      const groupedBySubject = nodes.reduce((acc, node) => {
        const subject = node.subject;
        if (!acc[subject]) acc[subject] = { nodes: [], links: [] };
        acc[subject].nodes.push(node);
        return acc;
      }, {});

      Object.values(groupedBySubject).forEach((group) => {
        group.links = links.filter(
          (link) =>
            group.nodes.find((n) => n.id === link.source) &&
            group.nodes.find((n) => n.id === link.target)
        );
      });

      setGraphData({ nodes, links });
      setGroupedNodes(groupedBySubject);
    }).catch((err) => console.error(err));
  }, []);

  const subjects = Object.keys(groupedNodes);
  const visibleSubjects = activeSubject
    ? [[activeSubject, groupedNodes[activeSubject]]]
    : Object.entries(groupedNodes);

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: "200px",
            flexShrink: 0,
            borderRight: "1px solid #2a2a2a",
            padding: "20px 0",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 16px" }}>
            Categorias
          </p>
          <button
            onClick={() => setActiveSubject(null)}
            style={{
              background: activeSubject === null ? "#1a3a4a" : "none",
              border: "none",
              borderLeft: activeSubject === null ? "3px solid #4fc3f7" : "3px solid transparent",
              color: activeSubject === null ? "#4fc3f7" : "#999",
              textAlign: "left",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "13px",
              width: "100%",
            }}
          >
            Todos
            <span style={{ float: "right", color: "#555", fontSize: "11px" }}>{graphData.nodes.length}</span>
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              style={{
                background: activeSubject === s ? "#1a3a4a" : "none",
                border: "none",
                borderLeft: activeSubject === s ? "3px solid #4fc3f7" : "3px solid transparent",
                color: activeSubject === s ? "#4fc3f7" : "#999",
                textAlign: "left",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "13px",
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s}
              <span style={{ float: "right", color: "#555", fontSize: "11px" }}>{groupedNodes[s].nodes.length}</span>
            </button>
          ))}
        </aside>

        {/* Cards de destaque */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            padding: "20px",
            alignContent: "flex-start",
          }}
        >
          {visibleSubjects.map(([subject, { nodes }]) => {
            const topPosts = [...nodes]
              .filter((n) => !n.isStub)
              .sort((a, b) => b.viewCount - a.viewCount)
              .slice(0, 5);

            return (
              <div
                key={subject}
                style={{
                  width: "280px",
                  background: "#242424",
                  borderRadius: "8px",
                  padding: "16px",
                  border: "1px solid #2e2e2e",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ color: "#e0e0e0", fontSize: "14px", fontWeight: "bold", margin: 0 }}>
                    {subject}
                  </h3>
                  <span style={{ color: "#555", fontSize: "11px" }}>{nodes.length} post{nodes.length !== 1 ? "s" : ""}</span>
                </div>

                {topPosts.length === 0 ? (
                  <p style={{ color: "#444", fontSize: "13px", margin: 0 }}>Nenhum post publicado.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    {topPosts.map((post, i) => (
                      <li key={post.id}>
                        <button
                          onClick={() => navigate(`/post/${post.id}`)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#2e2e2e"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                          style={{
                            width: "100%",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "7px 8px",
                            borderRadius: "4px",
                            textAlign: "left",
                            gap: "8px",
                          }}
                        >
                          <span style={{ color: "#3a3a3a", fontSize: "11px", flexShrink: 0, width: "14px" }}>
                            {i + 1}.
                          </span>
                          <span
                            style={{
                              color: "#ccc",
                              fontSize: "13px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {post.title}
                          </span>
                          {post.viewCount > 0 && (
                            <span style={{ color: "#4fc3f7", fontSize: "11px", flexShrink: 0 }}>
                              {post.viewCount}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default App;
