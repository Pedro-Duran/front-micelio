import React, { useEffect, useRef, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";
import { parsePage, authFetch } from "../../utils/api";
import { GRAPH_PRESETS, PRESET_KEY } from "../../utils/graphPresets";

function applyPreset(fgRef, preset) {
  if (!fgRef.current) return;
  fgRef.current.d3Force("charge").strength(preset.charge);
  fgRef.current.d3Force("link")?.distance(preset.linkDistance);
  if (preset.linkStrength !== undefined) {
    fgRef.current.d3Force("link")?.strength(preset.linkStrength);
  }
  fgRef.current.d3Force("center")?.strength(0.04);
  fgRef.current.d3ReheatSimulation();
}

const MIN_CARD_W = 180;
const MAX_CARD_W = 560;
const DEFAULT_CARD_W = 260;

function PreviewCard({ preset, nodes, links, selected, onSelect }) {
  const fgRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(DEFAULT_CARD_W);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  useEffect(() => {
    if (!fgRef.current || nodes.length === 0) return;
    applyPreset(fgRef, preset);
  }, [nodes, preset]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const next = Math.min(MAX_CARD_W, Math.max(MIN_CARD_W, startW.current + e.clientX - startX.current));
      setCardWidth(next);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const onHandleMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = cardWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      style={{
        background: "#141414",
        border: `1px solid ${selected ? "#4fc3f7" : "#2a2a2a"}`,
        borderRadius: "10px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s",
        cursor: "default",
        position: "relative",
        width: `${cardWidth}px`,
        flexShrink: 0,
      }}
    >
      {/* Graph */}
      <div style={{ background: "#1a1a2e", position: "relative" }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes, links }}
          nodeLabel="title"
          width={cardWidth}
          height={180}
          d3AlphaDecay={preset.d3AlphaDecay}
          d3VelocityDecay={preset.d3VelocityDecay}
          warmupTicks={preset.warmupTicks}
          cooldownTicks={preset.cooldownTicks}
          minZoom={preset.minZoom}
          linkColor={() => "rgba(22, 157, 211, 0.4)"}
          backgroundColor="#1a1a2e"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const radius = node.isStub ? 3 : 5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.isStub ? "rgba(100,150,200,0.3)" : "#4fc3f7";
            ctx.fill();
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = node.isStub ? "rgba(100,150,200,0.55)" : "rgba(200,200,200,0.8)";
            ctx.fillText(node.title, node.x, node.y + radius + 2 / globalScale);
          }}
        />
      </div>

      {/* Info + button */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
        <span style={{ color: "#e0e0e0", fontWeight: 600, fontSize: "13px" }}>{preset.nome}</span>
        <span style={{ color: "#666", fontSize: "11px", lineHeight: 1.5 }}>{preset.descricao}</span>
        <button
          onClick={() => onSelect(preset)}
          style={{
            marginTop: "auto",
            padding: "6px 12px",
            background: selected ? "#1a3a4a" : "none",
            border: `1px solid ${selected ? "#4fc3f7" : "#333"}`,
            borderRadius: "5px",
            color: selected ? "#4fc3f7" : "#666",
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.15s",
            alignSelf: "flex-start",
          }}
          onMouseEnter={(e) => {
            if (!selected) { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#555"; }
          }}
          onMouseLeave={(e) => {
            if (!selected) { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#333"; }
          }}
        >
          {selected ? "✓ Selecionado" : "Selecionar este"}
        </button>
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onHandleMouseDown}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "5px",
          height: "100%",
          cursor: "col-resize",
          zIndex: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,195,247,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      />
    </div>
  );
}

function GraphPreferences() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(
    () => localStorage.getItem(PRESET_KEY) || ""
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch("/api/users/preferences")
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then((data) => {
        if (data?.graphPreset) {
          localStorage.setItem(PRESET_KEY, data.graphPreset);
          setSelectedPreset(data.graphPreset);
        }
      });
  }, []);

  useEffect(() => {
    fetch("/api/posts/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSubjects(list);
        if (list.length > 0) setSelectedSubject(list[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    fetch("/api/posts/verPosts")
      .then((r) => (r.ok ? r.json() : []))
      .then((raw) => parsePage(raw).content)
      .then((data) => {
        const getSubjs = (p) => Array.isArray(p.subjects) && p.subjects.length > 0
          ? p.subjects : (p.subject ? [p.subject] : []);

        const writtenTitles = new Set(
          data.filter((p) => !p.isStub).map((p) => p.title?.toLowerCase().trim()).filter(Boolean)
        );
        const deduped = data.filter(
          (p) => !p.isStub || !writtenTitles.has(p.title?.toLowerCase().trim())
        );

        const subjectNodes = deduped
          .filter((p) => getSubjs(p).includes(selectedSubject))
          .map((p) => ({
            id: p.id,
            title: p.title || "Sem título",
            isStub: p.isStub || false,
          }));

        const nodeIds = new Set(subjectNodes.map((n) => n.id));
        const subjectLinks = [];
        deduped.forEach((p) => {
          if (!nodeIds.has(p.id)) return;
          if (Array.isArray(p.links)) {
            p.links.forEach((linkedId) => {
              if (nodeIds.has(linkedId)) subjectLinks.push({ source: p.id, target: linkedId });
            });
          }
        });

        setNodes(subjectNodes);
        setLinks(subjectLinks);
      })
      .catch(() => {});
  }, [selectedSubject]);

  const handleSave = async () => {
    if (!selectedPreset || saving) return;
    setSaving(true);
    localStorage.setItem(PRESET_KEY, selectedPreset);
    try {
      await authFetch("/api/users/preferences", {
        method: "PUT",
        body: JSON.stringify({ graphPreset: selectedPreset }),
      });
    } catch {
      // localStorage já foi salvo; falha silenciosa na API
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate("/"); }, 1200);
  };

  return (
    <>
      <Cabecalho />
      <div style={{ minHeight: "calc(100vh - 60px)", background: "#1e1e1e", padding: "32px 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#e0e0e0", fontSize: "18px", fontWeight: 600, margin: "0 0 6px" }}>
              Preferências de grafos
            </h2>
            <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>
              Escolha um subject para visualizar os nodes e selecione o comportamento que preferir.
            </p>
          </div>

          {/* Subject selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <label style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
                borderRadius: "5px",
                color: "#ccc",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Preset cards */}
          <div style={{ display: "flex", flexWrap: "nowrap", gap: "16px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
            {GRAPH_PRESETS.map((preset) => (
              <PreviewCard
                key={preset.nome}
                preset={preset}
                nodes={nodes}
                links={links}
                selected={selectedPreset === preset.nome}
                onSelect={(p) => setSelectedPreset(p.nome)}
              />
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!selectedPreset || saving}
            style={{
              padding: "10px 24px",
              background: saved ? "#1a3a2a" : "#1a2a35",
              border: `1px solid ${saved ? "#2e6b4a" : "#1e4a62"}`,
              borderRadius: "6px",
              color: saved ? "#81c784" : "#4fc3f7",
              fontSize: "13px",
              cursor: selectedPreset ? "pointer" : "not-allowed",
              opacity: selectedPreset ? 1 : 0.4,
              transition: "all 0.2s",
            }}
          >
            {saved ? "✓ Salvo! Voltando..." : saving ? "Salvando..." : "Salvar preferência"}
          </button>
        </div>
      </div>
    </>
  );
}

export default GraphPreferences;
