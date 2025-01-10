import React, { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import Cabecalho from "./components/Cabecalho";

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [groupedNodes, setGroupedNodes] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    // Chame seu endpoint para obter os posts
    fetch("http://localhost:8080/api/posts/verPosts")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro na requisição");
        }
        return response.json();
      })
      .then((data) => {
        // Validação e transformação dos dados
        const nodes = data.map((post) => ({
          id: post.id,
          title: post.title || "Título não disponível",
          content: post.content || "Conteúdo não disponível",
          author: post.author.username || "Autor desconhecido",
          subject: post.subject || "Sem categoria",
        }));

        const links = [];
        data.forEach((post) => {
          if (Array.isArray(post.links)) {
            post.links.forEach((linkedId) => {
              links.push({ source: post.id, target: linkedId });
            });
          }
        });

        // Agrupando por subject
        const groupedBySubject = nodes.reduce((acc, node) => {
          const subject = node.subject;
          if (!acc[subject]) {
            acc[subject] = { nodes: [], links: [] };
          }
          acc[subject].nodes.push(node);
          acc[subject].links = links.filter(
            (link) =>
              acc[subject].nodes.find((n) => n.id === link.source) &&
              acc[subject].nodes.find((n) => n.id === link.target)
          );
          return acc;
        }, {});

        setGraphData({ nodes, links });
        setGroupedNodes(groupedBySubject);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <Cabecalho />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          padding: "20px",
          background: "#1e1e1e",
        }}
      >
        {Object.entries(groupedNodes).map(([subject, { nodes, links }]) => (
          <div
            key={subject}
            style={{
              width: "300px",
              height: "300px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#f5f5f5",
              padding: "10px",
              overflow: "hidden",
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
              {subject}
            </h3>
            <ForceGraph2D
              graphData={{ nodes, links }}
              nodeLabel="title"
              nodeAutoColorBy="id"
              linkColor={() => "rgba(0, 0, 0, 0.5)"}
              width={280} // Ajuste do tamanho do gráfico
              height={200}
              onNodeClick={(node) => setSelectedNode(node)} // Abre o card do node
              nodeCanvasObject={(node, ctx) => {
                const radius = 5;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = "#888";
                ctx.fill();
              }}
            />
          </div>
        ))}

        {selectedNode && (
          <Post
            title={selectedNode.title}
            content={selectedNode.content}
            author={selectedNode.author}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </>
  );
}

function Post({ title, content, author, onClose }) {
  return (
    <div
      style={{
        width: "400px",
        padding: "20px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        borderRadius: "8px",
        position: "absolute",
        top: "10%",
        right: "10%",
        zIndex: 1000,
      }}
    >
      <button
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
        onClick={onClose}
      >
        ❌
      </button>
      <h2 style={{ marginBottom: "10px" }}>{title}</h2>
      <p style={{ marginBottom: "10px" }}>{content}</p>
      <p style={{ fontStyle: "italic", color: "gray" }}>Autor: {author}</p>
    </div>
  );
}

export default App;
