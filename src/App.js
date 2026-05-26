import React, { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import { useNavigate } from "react-router-dom";
import Cabecalho from "./components/Cabecalho";
import SubjectsSidebar from "./components/SubjectsSidebar";
import { authFetch } from "./utils/api";

function lerpColor(t) {
  const r = Math.round(26 + t * (79 - 26));
  const g = Math.round(74 + t * (195 - 74));
  const b = Math.round(90 + t * (247 - 90));
  return `rgb(${r},${g},${b})`;
}

function SubjectCard({ subject, nodes, links, onNodeClick }) {
  const navigate = useNavigate();
  const maxVc = Math.max(...nodes.map((n) => n.viewCount), 1);
  const topPosts = [...nodes]
    .filter((n) => !n.isStub)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 3);

  const paintNode = (node, ctx, globalScale) => {
    const t = node.isStub ? 0 : node.viewCount / maxVc;
    const radius = node.isStub ? 3 : 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.isStub ? "rgba(100, 150, 200, 0.3)" : lerpColor(t);
    ctx.fill();

    const opacity = Math.min(1, Math.max(0, (globalScale - 0.5) / 0.8));
    if (opacity > 0) {
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = `rgba(220, 220, 220, ${opacity})`;
      ctx.fillText(node.title, node.x, node.y + radius + 2 / globalScale);
    }
  };

  return (
    <div
      style={{
        width: "300px",
        background: "#242424",
        borderRadius: "8px",
        border: "1px solid #2e2e2e",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        onClick={() => navigate(`/subject/${encodeURIComponent(subject)}`)}
        style={{
          margin: 0,
          padding: "12px 14px 8px",
          fontSize: "13px",
          fontWeight: "bold",
          color: "#e0e0e0",
          borderBottom: "1px solid #2e2e2e",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#4fc3f7"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#e0e0e0"; }}
      >
        {subject}
        <span style={{ color: "#555", fontSize: "11px", fontWeight: "normal" }}>
          {nodes.length} post{nodes.length !== 1 ? "s" : ""}
        </span>
      </h3>

      <div style={{ background: "#1e1e1e" }}>
        <ForceGraph2D
          graphData={{ nodes, links }}
          nodeLabel="title"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          linkColor={() => "rgba(22, 157, 211, 0.4)"}
          width={300}
          height={180}
          onNodeClick={onNodeClick}
          backgroundColor="#1e1e1e"
        />
      </div>

      {topPosts.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: "8px 0", display: "flex", flexDirection: "column", gap: "2px" }}>
          {topPosts.map((post, i) => (
            <li key={post.id}>
              <button
                onClick={() => onNodeClick(post)}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#2e2e2e"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 14px",
                  gap: "8px",
                  textAlign: "left",
                }}
              >
                <span style={{ color: "#3a3a3a", fontSize: "11px", width: "14px", flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ color: "#ccc", fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.title}
                </span>
                {post.viewCount > 0 && (
                  <span style={{ color: "#4fc3f7", fontSize: "11px", flexShrink: 0 }}>{post.viewCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
