import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Cabecalho from "../Cabecalho";
import { authFetch } from "../../utils/api";

const ACCENT = "#4fc3f7";
const ACCENT_DIM = "#1a6b8a";

const cardStyle = {
  background: "#2a2a2a",
  borderRadius: "8px",
  padding: "20px 28px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const labelStyle = {
  color: "#888",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const valueStyle = {
  color: "#e0e0e0",
  fontSize: "28px",
  fontWeight: "bold",
};

const sectionTitle = {
  color: "#888",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "12px",
};

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1e1e1e",
        border: "1px solid #333",
        borderRadius: "6px",
        padding: "8px 14px",
        fontSize: "13px",
        color: "#e0e0e0",
      }}
    >
      <p style={{ margin: 0, color: "#888", marginBottom: "4px" }}>{label}</p>
      <p style={{ margin: 0 }}>
        {payload[0].value}
        {unit && <span style={{ color: "#888" }}> {unit}</span>}
      </p>
    </div>
  );
};

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/events/summary")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar analytics");
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalViews = data.reduce((acc, d) => acc + (d.viewCount || 0), 0);
  const totalClicks = data.reduce((acc, d) => acc + (d.nodeClickCount || 0), 0);
  const overallAvgDuration =
    data.length > 0
      ? Math.round(data.reduce((acc, d) => acc + (d.avgDuration || 0), 0) / data.length)
      : 0;

  const truncate = (str, n = 18) =>
    str && str.length > n ? str.slice(0, n) + "…" : str;

  const chartData = data.map((d) => ({
    ...d,
    shortTitle: truncate(d.title),
    avgDuration: Math.round(d.avgDuration || 0),
  }));

  return (
    <>
      <Cabecalho />
      <div
        style={{
          background: "#1e1e1e",
          minHeight: "calc(100vh - 60px)",
          padding: "40px 60px",
          color: "#e0e0e0",
        }}
      >
        <h1 style={{ fontSize: "22px", marginTop: 0, marginBottom: "32px" }}>
          Analytics
        </h1>

        {loading ? (
          <p style={{ color: "#888" }}>Carregando...</p>
        ) : data.length === 0 ? (
          <p style={{ color: "#888" }}>Nenhum dado de sessão registrado ainda.</p>
        ) : (
          <>
            {/* Cartões de resumo */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                marginBottom: "48px",
              }}
            >
              <div style={cardStyle}>
                <span style={labelStyle}>Total de visualizações</span>
                <span style={valueStyle}>{totalViews}</span>
              </div>
              <div style={cardStyle}>
                <span style={labelStyle}>Tempo médio de leitura</span>
                <span style={valueStyle}>
                  {overallAvgDuration}
                  <span style={{ fontSize: "16px", color: "#888", marginLeft: "6px" }}>s</span>
                </span>
              </div>
              <div style={cardStyle}>
                <span style={labelStyle}>Clicks em nós do grafo</span>
                <span style={valueStyle}>{totalClicks}</span>
              </div>
            </div>

            {/* Gráfico: Visualizações por post */}
            <div style={{ marginBottom: "48px" }}>
              <p style={sectionTitle}>Visualizações por post</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis
                    dataKey="shortTitle"
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2a2a2a" }} />
                  <Bar dataKey="viewCount" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? ACCENT : ACCENT_DIM} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico: Tempo médio de leitura */}
            <div style={{ marginBottom: "48px" }}>
              <p style={sectionTitle}>Tempo médio de leitura por post (segundos)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis
                    dataKey="shortTitle"
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip unit="s" />} cursor={{ fill: "#2a2a2a" }} />
                  <Bar dataKey="avgDuration" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? ACCENT : ACCENT_DIM} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico: Clicks em nós */}
            <div style={{ marginBottom: "48px" }}>
              <p style={sectionTitle}>Clicks em nós do grafo por post</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis
                    dataKey="shortTitle"
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2a2a2a" }} />
                  <Bar dataKey="nodeClickCount" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? ACCENT : ACCENT_DIM} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;
