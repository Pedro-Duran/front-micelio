import React, { useEffect, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import Cabecalho from "./components/Cabecalho";
import Post from "./components/Post";

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
        //Guardo na variável "nodes" vários objetos "post",
        // que tiveram seus atributos devidamente mapeados pelo map
        const nodes = data.map((post) => ({
          id: post.id,
          title: post.title || "Título não disponível",
          content: post.content || "-",
          author: post.author.username || "Autor desconhecido",
          subject: post.subject || "Sem categoria",
        }));

        // Na requisição, os posts vêm com um atributo chamado "links", que é um array.
        // Iteramos por esse array e para cada elemento nele presente, adicionamos um "source" e um "target"
        //Sendo o source o id do post que têm seu atributo de array iterado,
        // e o target cada um dos ids de posts que serão linkados

        const links = [];
        data.forEach((post) => {
          if (Array.isArray(post.links)) {
            post.links.forEach((linkedId) => {
              links.push({ source: post.id, target: linkedId });
            });
          }
        });

        // Agrupando por subject
        //O reduce é usado para construir um objeto (acc, que significa acumulador)
        //Se o acumulador ainda não tiver registrado o subject ( if (!acc[subject])), ele cria
        // um subject com um array de nodes vazios, e os links entre esses nodes também são inicializados
        //como um array vazio.
        //Percorremos os links com um filter para checar se tanto o source quanto o target estão dentro do
        //subject. Filter é uma função que retorna um novo array a partir de valores filtrados de um primeiro
        // array
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
              linkColor={() => "rgba(22, 157, 211, 0.5)"}
              width={280} // Ajuste do tamanho do gráfico
              height={200}
              onNodeClick={(node) => setSelectedNode(node)} // Abre o card do node
              nodeCanvasObject={(node, ctx) => {
                const radius = 5;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = "#128";
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
            id={selectedNode.id}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </>
  );
}

export default App;
