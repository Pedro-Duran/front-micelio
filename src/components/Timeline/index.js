import React, { useEffect, useState, useRef } from "react";
import { ForceGraph2D } from "react-force-graph";
import Cabecalho from "../Cabecalho";

const SPEEDS = { Devagar: 2000, Normal: 1000, "Rápido": 400 };

function Timeline() {
  const [allPosts, setAllPosts] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [speed, setSpeed] = useState("Normal");
  const [isRecording, setIsRecording] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const containerRef = useRef();
  const recorderRef = useRef();
  const chunksRef = useRef([]);

  useEffect(() => {
    fetch("/api/posts/verPosts")
      .then((res) => res.json())
      .then((raw) => Array.isArray(raw) ? raw : (raw.content ?? []))
      .then((data) => {
        const sorted = data
          .filter((p) => !p.isStub)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setAllPosts(sorted);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Loop de animação
  useEffect(() => {
    if (!isPlaying) return;

    if (currentIndex >= allPosts.length) {
      setIsPlaying(false);
      setIsDone(true);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      return;
    }

    const timer = setTimeout(() => {
      const post = allPosts[currentIndex];
      setGraphData((prev) => {
        const existingIds = new Set(prev.nodes.map((n) => n.id));
        const newLinks = (post.links || [])
          .filter((id) => existingIds.has(id))
          .map((id) => ({ source: post.id, target: id }));
        return {
          nodes: [
            ...prev.nodes,
            { id: post.id, title: post.title, createdAt: post.createdAt, fresh: true },
          ],
          links: [...prev.links, ...newLinks],
        };
      });
      setCurrentIndex((i) => i + 1);
    }, SPEEDS[speed]);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, allPosts, speed]);

  const reset = () => {
    setGraphData({ nodes: [], links: [] });
    setCurrentIndex(0);
    setIsDone(false);
  };

  const handlePlay = () => {
    if (isDone) reset();
    setIsPlaying(true);
  };

  const handleRecord = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;

    reset();
    chunksRef.current = [];

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pensamento.webm";
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };

    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setIsPlaying(true);
  };

  const progress = allPosts.length > 0 ? (currentIndex / allPosts.length) * 100 : 0;
  const currentPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  return (
    <>
      <Cabecalho />
      <div
        style={{
          background: "#1e1e1e",
          height: "calc(100vh - 60px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Área do grafo */}
        <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {allPosts.length === 0 ? (
            <div style={{ color: "#888", padding: "60px", textAlign: "center" }}>
              Carregando posts...
            </div>
          ) : (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="title"
              linkColor={() => "rgba(22, 157, 211, 0.45)"}
              backgroundColor="#1e1e1e"
              width={dimensions.width}
              height={dimensions.height}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const radius = 5;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.fresh ? "#4fc3f7" : "#1a6b8a";
                ctx.fill();

                const fontSize = Math.max(10 / globalScale, 3);
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.fillStyle = "rgba(224, 224, 224, 0.85)";
                ctx.textAlign = "center";
                ctx.fillText(node.title, node.x, node.y - radius - 3 / globalScale);
              }}
            />
          )}

          {/* Overlay com post atual */}
          {currentPost && (
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "rgba(0,0,0,0.65)",
                color: "#e0e0e0",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                pointerEvents: "none",
              }}
            >
              <span style={{ color: "#888" }}>
                {new Date(currentPost.createdAt).toLocaleDateString("pt-BR")}
              </span>
              <span style={{ margin: "0 8px", color: "#444" }}>·</span>
              {currentPost.title}
            </div>
          )}

          {isDone && (
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "#888",
                fontSize: "13px",
                pointerEvents: "none",
              }}
            >
              {allPosts.length} posts · fim
            </div>
          )}
        </div>

        {/* Barra de controles */}
        <div
          style={{
            height: "72px",
            background: "#141414",
            borderTop: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: "20px",
            flexShrink: 0,
          }}
        >
          {/* Play / Pause */}
          <button
            onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
            disabled={allPosts.length === 0}
            style={{
              background: isPlaying ? "#555" : "#4fc3f7",
              border: "none",
              borderRadius: "50%",
              width: "38px",
              height: "38px",
              cursor: allPosts.length === 0 ? "default" : "pointer",
              fontSize: "14px",
              color: isPlaying ? "#ccc" : "#000",
              flexShrink: 0,
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Barra de progresso */}
          <div
            style={{
              flex: 1,
              height: "4px",
              background: "#2a2a2a",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#4fc3f7",
                borderRadius: "2px",
                transition: `width ${SPEEDS[speed]}ms linear`,
              }}
            />
          </div>

          {/* Controle de velocidade */}
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            {Object.keys(SPEEDS).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: "4px 12px",
                  background: speed === s ? "#4fc3f7" : "#2a2a2a",
                  color: speed === s ? "#000" : "#888",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Gravar e baixar */}
          <button
            onClick={handleRecord}
            disabled={isRecording || isPlaying || allPosts.length === 0}
            style={{
              padding: "8px 18px",
              background: isRecording ? "#2a2a2a" : "#1e1e1e",
              color: isRecording ? "#555" : "#e0e0e0",
              border: "1px solid #333",
              borderRadius: "6px",
              cursor: isRecording || isPlaying ? "default" : "pointer",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            {isRecording ? "⏺ Gravando..." : "⬇ Gravar e baixar"}
          </button>
        </div>
      </div>
    </>
  );
}

export default Timeline;
