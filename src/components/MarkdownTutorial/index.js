import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useSearchParams } from "react-router-dom";
import Cabecalho from "../Cabecalho";

const COMMITS = [
  {
    hash: "3a8e9b5",
    message: "[[título]] linka outro post deste blog",
    markdown: "Veja também: [[Bem-vindo ao Blog]]\n\n> Exclusivo deste blog — cria um nó conectado no grafo.",
  },
  {
    hash: "a1f3c2e",
    message: "# cria um cabeçalho h1",
    markdown: "# Meu primeiro título",
  },
  {
    hash: "b82d910",
    message: "## e ### fazem h2 e h3",
    markdown: "## Seção importante\n\n### Detalhe da seção",
  },
  {
    hash: "c49a701",
    message: "**negrito** e *itálico* com asteriscos",
    markdown: "**Este texto é negrito** e *este é itálico*.",
  },
  {
    hash: "d3e5f82",
    message: "listas com - ou 1. no início da linha",
    markdown: "- Primeiro item\n- Segundo item\n- Terceiro item\n\n1. Passo um\n2. Passo dois\n3. Passo três",
  },
  {
    hash: "e70c334",
    message: "`código inline` com backtick",
    markdown: "Use `const x = 1` para código em linha.\n\nOu `npm install` no terminal.",
  },
  {
    hash: "f1b2a59",
    message: "bloco de código com três backticks",
    markdown: "```js\nfunction saudacao(nome) {\n  return `Olá, ${nome}!`;\n}\n```",
  },
  {
    hash: "07d9c1a",
    message: "[link](url) e ![imagem](url)",
    markdown: "[Visite o Google](https://google.com)\n\n![Exemplo de imagem](https://puredo-blog-images-prod.s3.us-east-2.amazonaws.com/thumbnails/a8a8dafc-3671-47da-a492-3d3aef3e3d97.jpg)",
  },
  {
    hash: "18e4b63",
    message: "> blockquote com sinal de maior",
    markdown: "> Markdown é uma forma de escrever\n> HTML sem digitar HTML.",
  },
  {
    hash: "29f7d04",
    message: "--- cria uma linha horizontal",
    markdown: "Parte de cima\n\n---\n\nParte de baixo",
  },
];

const mdComponents = {
  h1: ({ children }) => (
    <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#e0e0e0", margin: "0 0 8px" }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#e0e0e0", margin: "0 0 6px" }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ccc", margin: "0 0 4px" }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ color: "#ccc", lineHeight: 1.65, margin: "0 0 8px" }}>{children}</p>
  ),
  strong: ({ children }) => <strong style={{ color: "#fff" }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: "#b0c4de" }}>{children}</em>,
  code: ({ inline, children }) =>
    inline ? (
      <code style={{ background: "#2a2a2a", color: "#80cbc4", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", fontSize: "0.85em" }}>
        {children}
      </code>
    ) : (
      <pre style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", padding: "10px 14px", overflowX: "auto", margin: "4px 0" }}>
        <code style={{ color: "#a5d6a7", fontFamily: "monospace", fontSize: "0.85em" }}>{children}</code>
      </pre>
    ),
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: "3px solid #4fc3f7", margin: "4px 0", paddingLeft: "12px", color: "#aaa", fontStyle: "italic" }}>
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul style={{ paddingLeft: "20px", color: "#ccc", margin: "4px 0" }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: "20px", color: "#ccc", margin: "4px 0" }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: "2px" }}>{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: "#4fc3f7", textDecoration: "underline" }}>{children}</a>
  ),
  hr: () => <hr style={{ border: "none", borderTop: "1px solid #444", margin: "10px 0" }} />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt} style={{ maxWidth: "100%", borderRadius: "4px", display: "block", marginTop: "4px" }} />
  ),
};

function CommitList({ commits, selected, onSelect, compact, widthPx }) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #2a2a2a",
        borderRadius: compact ? "12px 0 0 12px" : "8px 8px 0 0",
        fontFamily: "monospace",
        fontSize: compact ? "11px" : "13px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...(compact ? { width: widthPx ? `${widthPx}px` : "44%", flexShrink: 0 } : {}),
      }}
    >
      <div
        style={{
          padding: compact ? "8px 12px" : "10px 16px",
          borderBottom: "1px solid #222",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          flexShrink: 0,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
        <span style={{ color: "#555", fontSize: "10px", marginLeft: "6px" }}>markdown-tutorial</span>
      </div>

      <div style={{ padding: compact ? "6px 0" : "10px 0", overflowY: "auto", flex: 1 }}>
        {!compact && (
          <div style={{ padding: "3px 16px", color: "#555", fontSize: "11px", marginBottom: "4px" }}>
            $ git log --oneline
          </div>
        )}
        {commits.map((c, i) => (
          <div
            key={c.hash}
            onClick={() => onSelect(i)}
            title={c.message}
            style={{
              display: "flex",
              alignItems: "center",
              gap: compact ? "8px" : "12px",
              padding: compact ? "4px 10px" : "5px 16px",
              cursor: "pointer",
              background: selected === i ? "rgba(79, 195, 247, 0.07)" : "transparent",
              borderLeft: selected === i ? "2px solid #4fc3f7" : "2px solid transparent",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              if (selected !== i) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
            onMouseLeave={(e) => {
              if (selected !== i) e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ color: selected === i ? "#4fc3f7" : "#e5a84a", minWidth: "44px", flexShrink: 0 }}>
              {c.hash}
            </span>
            <span
              style={{
                color: selected === i ? "#e0e0e0" : "#888",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.message}
            </span>
          </div>
        ))}
        {!compact && (
          <div style={{ padding: "6px 16px 0", color: "#555", fontSize: "11px" }}>$ _</div>
        )}
      </div>
    </div>
  );
}

function PreviewPanel({ commit, compact }) {
  return (
    <div
      style={{
        border: "1px solid #2a2a2a",
        borderRadius: compact ? "0 12px 12px 0" : "0 0 8px 8px",
        overflow: "hidden",
        background: "#181818",
        display: "flex",
        flexDirection: "column",
        ...(compact ? { flex: 1, borderLeft: "none" } : { borderTop: "none" }),
      }}
    >
      <div style={{ borderBottom: "1px solid #222", flexShrink: 0 }}>
        <div style={{ padding: compact ? "5px 12px" : "7px 16px", borderBottom: "1px solid #1e1e1e" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.12em", color: "#555", textTransform: "uppercase" }}>
            Markdown
          </span>
        </div>
        <pre
          style={{
            margin: 0,
            padding: compact ? "10px 12px" : "14px 16px",
            fontFamily: "monospace",
            fontSize: compact ? "11px" : "13px",
            color: "#80cbc4",
            background: "#161616",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: compact ? "90px" : "none",
            overflowY: compact ? "auto" : "visible",
          }}
        >
          {commit.markdown}
        </pre>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: compact ? "5px 12px" : "7px 16px", borderBottom: "1px solid #1e1e1e" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.12em", color: "#555", textTransform: "uppercase" }}>
            Resultado
          </span>
        </div>
        <div style={{ padding: compact ? "10px 14px" : "14px 20px" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={mdComponents}
          >
            {commit.markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function MarkdownTutorial() {
  const [selected, setSelected] = useState(0);
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "true";

  const [leftPx, setLeftPx] = useState(null);
  const containerRef = useRef(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startLeft = useRef(0);

  const onDividerMouseDown = useCallback((e) => {
    dragging.current = true;
    startX.current = e.clientX;
    startLeft.current = leftPx ?? (containerRef.current?.offsetWidth * 0.44 ?? 200);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftPx]);

  useEffect(() => {
    if (!embed) return;
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const next = startLeft.current + (e.clientX - startX.current);
      const total = containerRef.current.offsetWidth;
      setLeftPx(Math.min(total * 0.75, Math.max(total * 0.2, next)));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [embed]);

  const commit = COMMITS[selected];

  if (embed) {
    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100vh",
          background: "#1e1e1e",
          display: "flex",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <CommitList
          commits={COMMITS}
          selected={selected}
          onSelect={setSelected}
          compact
          widthPx={leftPx}
        />

        {/* Draggable divider */}
        <div
          onMouseDown={onDividerMouseDown}
          style={{
            width: "5px",
            flexShrink: 0,
            background: "#222",
            cursor: "col-resize",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,195,247,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#222"; }}
        />

        <PreviewPanel commit={commit} compact />
      </div>
    );
  }

  return (
    <>
      <Cabecalho />
      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          background: "#1e1e1e",
          display: "flex",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "760px", display: "flex", flexDirection: "column" }}>
          <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
            Tutorial de Markdown
          </p>

          <CommitList commits={COMMITS} selected={selected} onSelect={setSelected} compact={false} />

          <div
            style={{
              padding: "7px 0",
              textAlign: "center",
              color: "#444",
              fontSize: "11px",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderTop: "none",
            }}
          >
            Clique em qualquer commit para ver o exemplo
          </div>

          <PreviewPanel commit={commit} compact={false} />
        </div>
      </div>
    </>
  );
}

export default MarkdownTutorial;
