import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // data deve ser um array de posts
        // Transformando em nós e links
        const nodes = data.map((post) => ({
          id: post.id,
          title: post.title,
        }));

        const links = [];
        data.forEach((post) => {
          if (Array.isArray(post.links)) {
            post.links.forEach((linkedId) => {
              links.push({ source: post.id, target: linkedId });
            });
          }
        });

        setGraphData({ nodes, links });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div style={{ width: "100%", height: "100vh", background: "#1e1e1e" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="title"
        nodeAutoColorBy="id"
        linkColor={() => "rgba(255,255,255,0.6)"}
        backgroundColor="#F06412"
        // Aqui você pode customizar mais o visual
        nodeCanvasObject={(node, ctx, globalScale) => {
          const radius = 5; // raio do nó
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 5 * Math.PI, false);
          ctx.fillStyle = "#8"; // cinza suave
          ctx.fill();
        }}
      />
    </div>
  );
}

export default App;
