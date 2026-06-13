export const GRAPH_PRESETS = [
  {
    nome: "Arejado",
    descricao: "Nodes bem espaçados, settle rápido. Boa legibilidade para qualquer grafo.",
    d3AlphaDecay: 0.025,
    d3VelocityDecay: 0.5,
    warmupTicks: 120,
    cooldownTicks: 100,
    charge: -250,
    linkDistance: 80,
    minZoom: 0.3,
  },
  {
    nome: "Orgânico",
    descricao: "Simulação longa e suave, sensação de 'vivo'. Settle lento mas fluido.",
    d3AlphaDecay: 0.01,
    d3VelocityDecay: 0.25,
    warmupTicks: 60,
    cooldownTicks: 300,
    charge: -150,
    linkDistance: 60,
    minZoom: 0.3,
  },
  {
    nome: "Magnético",
    descricao: "Nodes muito próximos, links curtos e rígidos. Sensação de cluster denso.",
    d3AlphaDecay: 0.03,
    d3VelocityDecay: 0.6,
    warmupTicks: 100,
    cooldownTicks: 80,
    charge: -40,
    linkDistance: 20,
    linkStrength: 0.9,
    minZoom: 0.3,
  },
  {
    nome: "Galáxia",
    descricao: "Nodes muito espalhados, movimento lento e contínuo. Visual dramático.",
    d3AlphaDecay: 0.008,
    d3VelocityDecay: 0.12,
    warmupTicks: 20,
    cooldownTicks: 600,
    charge: -500,
    linkDistance: 160,
    linkStrength: 0.15,
    minZoom: 0.3,
  },
  {
    nome: "Caótico",
    descricao: "Alta energia, nodes em movimento contínuo. Nunca param completamente.",
    d3AlphaDecay: 0.005,
    d3VelocityDecay: 0.08,
    warmupTicks: 0,
    cooldownTicks: 2000,
    charge: -180,
    linkDistance: 90,
    linkStrength: 0.25,
    minZoom: 0.3,
  },
];

export const PRESET_KEY = "graphPreset";

export function getSavedPreset() {
  const saved = localStorage.getItem(PRESET_KEY);
  return GRAPH_PRESETS.find((p) => p.nome === saved)
    || GRAPH_PRESETS.find((p) => p.nome === "Arejado");
}
