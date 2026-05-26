import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "./components/Cabecalho";
import SubjectsSidebar from "./components/SubjectsSidebar";
import SubjectCard from "./components/SubjectCard";
import { authFetch } from "./utils/api";

function App() {
  const [groupedNodes, setGroupedNodes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch("/api/posts/verPosts").then((r) => {
        if (!r.ok) throw new Error("Erro ao buscar posts");
        return r.json();
      }).then((d) => Array.isArray(d) ? d : (d.content ?? [])),
      authFetch("/api/events/summary").then((r) => r.json()).catch(() => []),
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
          post.links.forEach((linkedId) => links.push({ source: post.id, target: linkedId }));
        }
      });

      const grouped = nodes.reduce((acc, node) => {
        const s = node.subject;
        if (!acc[s]) acc[s] = { nodes: [], links: [] };
        acc[s].nodes.push(node);
        return acc;
      }, {});

      Object.values(grouped).forEach((group) => {
        group.links = links.filter(
          (link) =>
            group.nodes.find((n) => n.id === link.source) &&
            group.nodes.find((n) => n.id === link.target)
        );
      });

      setGroupedNodes(grouped);
    }).catch((err) => console.error(err));
  }, []);

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
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
          {Object.entries(groupedNodes).map(([subject, { nodes, links }]) => (
            <SubjectCard
              key={subject}
              subject={subject}
              nodes={nodes}
              links={links}
              onNodeClick={(node) => navigate(`/post/${node.id}`)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
