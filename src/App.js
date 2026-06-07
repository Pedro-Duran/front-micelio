import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "./components/Cabecalho";
import SubjectsSidebar from "./components/SubjectsSidebar";
import SubjectCard from "./components/SubjectCard";
import { authFetch, parsePage } from "./utils/api";

function App() {
  const [groupedNodes, setGroupedNodes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch("/api/posts/verPosts").then((r) => {
        if (!r.ok) throw new Error("Erro ao buscar posts");
        return r.json();
      }).then((d) => parsePage(d).content),
      authFetch("/api/events/summary").then((r) => r.json()).catch(() => []),
    ]).then(([postsData, summaryData]) => {
      const vcMap = {};
      summaryData.forEach((s) => { vcMap[s.postId] = s.viewCount || 0; });

      const getSubjs = (p) => Array.isArray(p.subjects) && p.subjects.length > 0
        ? p.subjects : (p.subject ? [p.subject] : ["Sem categoria"]);

      const nodes = postsData.map((post) => {
        const subjs = getSubjs(post);
        return {
          id: post.id,
          title: post.title || "Título não disponível",
          content: post.content || "",
          subjects: subjs,
          subject: subjs[0] || "Sem categoria",
          isStub: post.isStub || false,
          viewCount: vcMap[post.id] || 0,
          coverImageUrl: post.coverImageUrl || null,
          authorUsername: post.authorUsername || post.author?.username || null,
        };
      });

      const links = [];
      postsData.forEach((post) => {
        if (Array.isArray(post.links)) {
          post.links.forEach((linkedId) => links.push({ source: post.id, target: linkedId }));
        }
      });

      const grouped = {};
      nodes.forEach((node) => {
        node.subjects.forEach((s) => {
          if (!grouped[s]) grouped[s] = { nodes: [], links: [] };
          if (!grouped[s].nodes.find((n) => n.id === node.id)) grouped[s].nodes.push(node);
        });
      });

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
              overlay
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
