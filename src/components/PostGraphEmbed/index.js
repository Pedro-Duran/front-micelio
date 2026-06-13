import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ForceGraph2D } from "react-force-graph";
import { getSavedPreset } from "../../utils/graphPresets";
import { usePosts } from "../../context/PostsContext";

const AUTHOR_PALETTE = ["#4fc3f7", "#81c784", "#ffb74d", "#f06292", "#ba68c8", "#4db6ac", "#fff176", "#ff8a65"];

function PostGraphEmbed() {
  const { id } = useParams();
  const postId = parseInt(id);

  const { posts: rawPosts, loading } = usePosts();

  const getSubjs = (p) => Array.isArray(p.subjects) && p.subjects.length > 0
    ? p.subjects : (p.subject ? [p.subject] : []);

  const allNodes = useMemo(() => rawPosts.map((p) => ({
    id: p.id,
    title: p.title || "Sem título",
    authorUsername: p.authorUsername || p.author?.username || null,
    subject: getSubjs(p)[0] || "Sem categoria",
    isStub: p.isStub || false,
  })), [rawPosts]); // eslint-disable-line react-hooks/exhaustive-deps

  const allLinks = useMemo(() => {
    const links = [];
    rawPosts.forEach((p) => {
      if (Array.isArray(p.links)) {
        p.links.forEach((linkedId) => links.push({ source: p.id, target: linkedId }));
      }
    });
    return links;
  }, [rawPosts]);

  const ready = !loading;

  const localGraphData = useMemo(() => {
    if (!ready) return { nodes: [], links: [] };

    const neighborIds = new Set([postId]);
    allLinks.forEach((link) => {
      const src = typeof link.source === "object" ? link.source.id : link.source;
      const tgt = typeof link.target === "object" ? link.target.id : link.target;
      if (src === postId) neighborIds.add(tgt);
      if (tgt === postId) neighborIds.add(src);
    });

    const localNodes = allNodes.filter((n) => neighborIds.has(n.id));
    const localLinks = allLinks
      .filter((link) => {
        const src = typeof link.source === "object" ? link.source.id : link.source;
        const tgt = typeof link.target === "object" ? link.target.id : link.target;
        return neighborIds.has(src) && neighborIds.has(tgt);
      })
      .map((link) => ({
        source: typeof link.source === "object" ? link.source.id : link.source,
        target: typeof link.target === "object" ? link.target.id : link.target,
      }));

    return { nodes: localNodes, links: localLinks };
  }, [ready, postId, allNodes, allLinks]);

  const authorColorMap = useMemo(() => {
    const bySubject = {};
    allNodes.forEach((n) => {
      if (!n.isStub && n.subject && n.authorUsername) {
        if (!bySubject[n.subject]) bySubject[n.subject] = new Set();
        bySubject[n.subject].add(n.authorUsername);
      }
    });
    const map = {};
    Object.entries(bySubject).forEach(([subject, authSet]) => {
      if (authSet.size >= 2) {
        const authors = Array.from(authSet);
        authors.forEach((author, i) => {
          map[`${author}::${subject}`] = AUTHOR_PALETTE[i % AUTHOR_PALETTE.length];
        });
      }
    });
    return map;
  }, [allNodes]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ready && localGraphData.nodes.length > 0 ? (
        <ForceGraph2D
          graphData={localGraphData}
          nodeLabel="title"
          width={window.innerWidth}
          height={window.innerHeight}
          linkColor={() => "rgba(22, 157, 211, 0.4)"}
          d3AlphaDecay={getSavedPreset().d3AlphaDecay}
          d3VelocityDecay={getSavedPreset().d3VelocityDecay}
          minZoom={getSavedPreset().minZoom}
          warmupTicks={getSavedPreset().warmupTicks}
          cooldownTicks={getSavedPreset().cooldownTicks}
          backgroundColor="#1a1a2e"
          onNodeClick={(node) => {
            window.open(`/post/${node.id}`, "_blank");
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const isCurrent = node.id === postId;
            const radius = isCurrent ? 7 : node.isStub ? 3 : 5;
            const colorKey = `${node.authorUsername}::${node.subject}`;
            const fillColor = node.isStub
              ? "rgba(100, 150, 200, 0.3)"
              : (authorColorMap[colorKey] || (isCurrent ? "#4fc3f7" : "#1a6b8a"));

            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = fillColor;
            ctx.fill();

            if (isCurrent) {
              ctx.strokeStyle = "rgba(255,255,255,0.45)";
              ctx.lineWidth = 1.5 / globalScale;
              ctx.stroke();
            }

            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = isCurrent
              ? "rgba(79, 195, 247, 0.9)"
              : node.isStub
              ? "rgba(100, 150, 200, 0.55)"
              : "rgba(200, 200, 200, 0.8)";
            ctx.fillText(node.title, node.x, node.y + radius + 2 / globalScale);
          }}
        />
      ) : (
        <span style={{ color: "#555", fontFamily: "monospace", fontSize: "12px" }}>
          {ready ? "Sem conexões" : "Carregando..."}
        </span>
      )}
    </div>
  );
}

export default PostGraphEmbed;
