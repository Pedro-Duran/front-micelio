import React, { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedPost, setSelectedPost] = useState(null);

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
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#1e1e1e" }}>
      <div style={{ flex: 1 }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="title"
          nodeAutoColorBy="id"
          linkColor={() => "rgba(255,255,255,0.6)"}
          onNodeClick={(node) => setSelectedPost(node)} // Atualiza o post selecionado
          nodeCanvasObject={(node, ctx) => {
            const radius = 5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = "#888";
            ctx.fill();
          }}
        />
      </div>
      {selectedPost && (
        <Post
          title={selectedPost.title}
          content={selectedPost.content}
          author={selectedPost.author}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
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
