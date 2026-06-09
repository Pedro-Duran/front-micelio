import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import Cabecalho from "../Cabecalho";
import { authFetch } from "../../utils/api";
import { useTranslation } from "react-i18next";

const ACCENT = "#4fc3f7";
const ACCENT_DIM = "#1a6b8a";
const RETENTION_COLOR = "#81c784";
const RETENTION_DIM   = "#2e5e35";
const PALETTE = ["#4fc3f7", "#81c784", "#ffb74d", "#f06292", "#ba68c8", "#4db6ac", "#fff176", "#ff8a65"];

const truncate = (str, n = 22) => (str?.length > n ? str.slice(0, n) + "…" : str ?? "");

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", color: "#e0e0e0" }}>
      <p style={{ margin: "0 0 4px", color: "#666" }}>{label}</p>
      <p style={{ margin: 0 }}>
        {payload[0].value}
        {unit && <span style={{ color: "#666" }}> {unit}</span>}
      </p>
    </div>
  );
};

const KpiCard = ({ label, sublabel, value, unit, muted }) => (
  <div style={{ background: "#242424", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "18px 22px" }}>
    <div style={{ marginBottom: "10px" }}>
      <div style={{ color: "#666", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px" }}>{label}</div>
      {sublabel && <div style={{ color: "#3a3a3a", fontSize: "10px", marginTop: "2px" }}>{sublabel}</div>}
    </div>
    <div style={{ color: muted ? "#444" : "#e0e0e0", fontSize: "28px", fontWeight: "700", lineHeight: 1 }}>
      {value}
      {unit && <span style={{ fontSize: "14px", color: "#555", marginLeft: "5px", fontWeight: "400" }}>{unit}</span>}
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <p style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "600", margin: "0 0 16px" }}>
    {children}
  </p>
);

const MiniTitle = ({ children }) => (
  <p style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 12px" }}>
    {children}
  </p>
);

function SimpleBar({ data, dataKey, unit, height = 190, nameKey = "shortTitle", baseColor, dimColor, onBarClick }) {
  const c1 = baseColor ?? ACCENT;
  const c2 = dimColor  ?? ACCENT_DIM;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="35%" margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
        <XAxis dataKey={nameKey} tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "#222" }} />
        <Bar
          dataKey={dataKey}
          radius={[3, 3, 0, 0]}
          onClick={onBarClick ? (item) => onBarClick(item) : undefined}
          style={{ cursor: onBarClick ? "pointer" : "default" }}
        >
          {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? c1 : c2} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RankList({ items, labelKey, valueKey, unit, color, emptyText }) {
  if (!items?.length) return <p style={{ color: "#3a3a3a", fontSize: "13px" }}>{emptyText}</p>;
  const max = Math.max(...items.map((x) => x[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#3a3a3a", fontSize: "11px", width: "16px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ color: "#ccc", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                {item[labelKey]}
              </span>
              <span style={{ color: color || ACCENT, fontSize: "12px", flexShrink: 0 }}>
                {item[valueKey]}{unit && ` ${unit}`}
              </span>
            </div>
            <div style={{ height: "2px", background: "#2a2a2a", borderRadius: "1px" }}>
              <div style={{ width: `${((item[valueKey] || 0) / max) * 100}%`, height: "100%", background: PALETTE[i % PALETTE.length], borderRadius: "1px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const Divider = () => <div style={{ borderTop: "1px solid #232323", margin: "40px 0" }} />;

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [summary, setSummary] = useState([]);
  const [coverConversion, setCoverConversion] = useState([]);
  const [subscriptions, setSubscriptions] = useState({ topSubscribers: [], topAuthors: [] });
  const [shareLeaderboard, setShareLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch("/api/events/summary").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      authFetch("/api/events/coverConversion").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      authFetch("/api/events/subscriptions").then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      authFetch("/api/events/shareLeaderboard").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([s, cc, subs, sl]) => {
      setSummary(Array.isArray(s) ? s : []);
      setCoverConversion(Array.isArray(cc) ? cc : []);
      setSubscriptions({
        topSubscribers: Array.isArray(subs?.topSubscribers) ? subs.topSubscribers : [],
        topAuthors: Array.isArray(subs?.topAuthors) ? subs.topAuthors : [],
      });
      setShareLeaderboard(Array.isArray(sl) ? sl : []);
      setLoading(false);
    });
  }, []);

  const subjects = useMemo(() => {
    const seen = new Set();
    summary.forEach((p) => { if (p.subject) seen.add(p.subject); });
    return [...seen].sort();
  }, [summary]);

  useEffect(() => {
    if (!activeSubject && subjects.length > 0) setActiveSubject(subjects[0]);
  }, [subjects, activeSubject]);

  const totalViews  = summary.reduce((a, d) => a + (d.viewCount || 0), 0);
  const totalShares = summary.reduce((a, d) => a + (d.shareCount || 0), 0);
  const avgDuration = summary.length > 0
    ? Math.round(summary.reduce((a, d) => a + (d.avgDuration || 0), 0) / summary.length)
    : 0;

  const topByViews = useMemo(() =>
    [...summary]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
      .map((p) => ({ ...p, shortTitle: truncate(p.title) })),
    [summary]
  );

  const topByRetention = useMemo(() =>
    [...summary]
      .filter((p) => (p.avgDuration || 0) > 0)
      .sort((a, b) => (b.avgDuration || 0) - (a.avgDuration || 0))
      .slice(0, 10)
      .map((p) => ({ ...p, shortTitle: truncate(p.title), avgDuration: Math.round(p.avgDuration) })),
    [summary]
  );

  const topByLikes = useMemo(() =>
    [...summary]
      .filter((p) => (p.likeCount || 0) > 0)
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 10)
      .map((p) => ({ ...p, shortTitle: truncate(p.title) })),
    [summary]
  );

  const subjectAggregates = useMemo(() => {
    const map = {};
    summary.forEach((p) => {
      const s = p.subject;
      if (!s) return;
      if (!map[s]) map[s] = { duration: 0, likes: 0, shares: 0, count: 0 };
      map[s].duration += p.avgDuration || 0;
      map[s].likes    += p.likeCount   || 0;
      map[s].shares   += p.shareCount  || 0;
      map[s].count++;
    });
    return Object.entries(map).map(([subject, v]) => ({
      shortTitle: truncate(subject, 16),
      subject,
      avgDuration: Math.round(v.duration / v.count),
      avgLikes:    +(v.likes  / v.count).toFixed(1),
      avgShares:   +(v.shares / v.count).toFixed(1),
    }));
  }, [summary]);

  const subjectPosts = useMemo(() =>
    summary
      .filter((p) => p.subject === activeSubject)
      .map((p) => ({ ...p, shortTitle: truncate(p.title), avgDuration: Math.round(p.avgDuration || 0) })),
    [summary, activeSubject]
  );

  const subjectCovers = useMemo(() =>
    coverConversion
      .filter((c) => c.subject === activeSubject)
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 6),
    [coverConversion, activeSubject]
  );

  const hasSubData = subscriptions.topSubscribers.length > 0 || subscriptions.topAuthors.length > 0;

  if (loading) {
    return (
      <>
        <Cabecalho />
        <div style={{ background: "#1e1e1e", minHeight: "calc(100vh - 60px)", padding: "40px 60px" }}>
          <p style={{ color: "#444" }}>{t("common.loading")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Cabecalho />
      <div style={{ background: "#1e1e1e", minHeight: "calc(100vh - 60px)", padding: "40px 60px", color: "#e0e0e0" }}>
        <h1 style={{ fontSize: "18px", marginTop: 0, marginBottom: "32px", color: "#888", fontWeight: "600", letterSpacing: "0.5px" }}>
          {t("dashboard.analytics")}
        </h1>

        {summary.length === 0 ? (
          <p style={{ color: "#444" }}>{t("dashboard.noData")}</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "48px" }}>
              <KpiCard label={t("dashboard.views")} sublabel={t("dashboard.totalAccumulated")} value={totalViews} />
              <KpiCard label={t("dashboard.avgReadTime")} sublabel={t("dashboard.avgAllPosts")} value={avgDuration} unit="s" />
              <KpiCard label={t("dashboard.shares")} sublabel={t("dashboard.totalAccumulated")} value={totalShares} muted={totalShares === 0} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px", marginBottom: "0" }}>
              <div>
                <SectionTitle>{t("dashboard.topPostsViews")}</SectionTitle>
                <SimpleBar
                  data={topByViews}
                  dataKey="viewCount"
                  height={200}
                  onBarClick={(item) => item.postId && navigate(`/post/${item.postId}`)}
                />
              </div>
              <div>
                <SectionTitle>{t("dashboard.retentionAvgRead")}</SectionTitle>
                {topByRetention.length === 0 ? (
                  <p style={{ color: "#444", fontSize: "13px", marginTop: "16px" }}>{t("dashboard.noReadData")}</p>
                ) : (
                  <SimpleBar
                    data={topByRetention}
                    dataKey="avgDuration"
                    unit="s"
                    height={200}
                    baseColor={RETENTION_COLOR}
                    dimColor={RETENTION_DIM}
                    onBarClick={(item) => item.postId && navigate(`/post/${item.postId}`)}
                  />
                )}
              </div>
              <div>
                <SectionTitle>{t("dashboard.mostLiked")}</SectionTitle>
                {topByLikes.length === 0 ? (
                  <p style={{ color: "#444", fontSize: "13px", marginTop: "16px" }}>{t("dashboard.noLikesData")}</p>
                ) : (
                  <SimpleBar
                    data={topByLikes}
                    dataKey="likeCount"
                    height={200}
                    baseColor="#f06292"
                    dimColor="#7a2a45"
                    onBarClick={(item) => item.postId && navigate(`/post/${item.postId}`)}
                  />
                )}
              </div>
            </div>

            <Divider />

            {subjectAggregates.length > 1 && (
              <>
                <SectionTitle>{t("dashboard.compareBySubject")}</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px", marginBottom: "0" }}>
                  <div>
                    <MiniTitle>{t("dashboard.avgReadTimeLabel")}</MiniTitle>
                    <SimpleBar data={subjectAggregates} dataKey="avgDuration" unit="s" height={180} />
                  </div>
                  <div>
                    <MiniTitle>{t("dashboard.avgSharesLabel")}</MiniTitle>
                    <SimpleBar data={subjectAggregates} dataKey="avgShares" height={180} baseColor="#ffb74d" dimColor="#7a5520" />
                  </div>
                  <div>
                    <MiniTitle>{t("dashboard.avgLikesLabel")}</MiniTitle>
                    <SimpleBar data={subjectAggregates} dataKey="avgLikes" height={180} baseColor="#f06292" dimColor="#7a2a45" />
                  </div>
                </div>
                <Divider />
              </>
            )}

            {subjects.length > 0 && (
              <>
                <SectionTitle>{t("dashboard.detailBySubject")}</SectionTitle>

                <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", marginBottom: "28px", overflowX: "auto" }}>
                  {subjects.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveSubject(s)}
                      style={{
                        background: "none", border: "none",
                        padding: "8px 18px",
                        color: activeSubject === s ? ACCENT : "#555",
                        fontSize: "13px", cursor: "pointer",
                        borderBottom: `2px solid ${activeSubject === s ? ACCENT : "transparent"}`,
                        marginBottom: "-1px",
                        whiteSpace: "nowrap", flexShrink: 0,
                        transition: "color 0.15s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {subjectPosts.length === 0 ? (
                  <p style={{ color: "#444", fontSize: "13px" }}>{t("dashboard.noPostsForSubject")}</p>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "32px" }}>
                      <div>
                        <MiniTitle>{t("dashboard.viewsByPost")}</MiniTitle>
                        <SimpleBar
                          data={subjectPosts}
                          dataKey="viewCount"
                          height={190}
                          onBarClick={(item) => item.postId && navigate(`/post/${item.postId}`)}
                        />
                      </div>
                      <div>
                        <MiniTitle>{t("dashboard.readTimeByPost")}</MiniTitle>
                        <SimpleBar
                          data={subjectPosts}
                          dataKey="avgDuration"
                          unit="s"
                          height={190}
                          baseColor={RETENTION_COLOR}
                          dimColor={RETENTION_DIM}
                          onBarClick={(item) => item.postId && navigate(`/post/${item.postId}`)}
                        />
                      </div>
                    </div>

                    {subjectPosts.some((p) => p.likeCount > 0) && (
                      <div style={{ marginBottom: "32px" }}>
                        <MiniTitle>{t("dashboard.likesByPost")}</MiniTitle>
                        <SimpleBar
                          data={subjectPosts}
                          dataKey="likeCount"
                          height={170}
                          baseColor="#f06292"
                          dimColor="#7a2a45"
                          onBarClick={(item) => item.postId && navigate(`/post/${item.postId}`)}
                        />
                      </div>
                    )}

                    {subjectCovers.length > 0 && (
                      <div>
                        <MiniTitle>{t("dashboard.coversConversion")}</MiniTitle>
                        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                          {subjectCovers.map((cover, i) => (
                            <div key={i} style={{ flexShrink: 0, width: "150px", borderRadius: "6px", overflow: "hidden", border: "1px solid #2a2a2a", background: "#242424" }}>
                              {cover.coverImageUrl ? (
                                <img src={cover.coverImageUrl} alt="" style={{ width: "100%", height: "96px", objectFit: "cover", display: "block" }} />
                              ) : (
                                <div style={{ width: "100%", height: "96px", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ color: "#3a3a3a", fontSize: "11px" }}>{t("dashboard.noCover")}</span>
                                </div>
                              )}
                              <div style={{ padding: "8px 10px" }}>
                                <p style={{ margin: "0 0 5px", color: "#888", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {truncate(cover.postTitle, 20)}
                                </p>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                                  <span style={{ color: ACCENT, fontSize: "16px", fontWeight: "700" }}>{cover.clickCount ?? 0}</span>
                                  <span style={{ color: "#555", fontSize: "11px" }}>{t("dashboard.clicks")}</span>
                                </div>
                                {cover.viewCount > 0 && (
                                  <p style={{ margin: "2px 0 0", color: "#444", fontSize: "11px" }}>
                                    {t("dashboard.ctr", { value: ((cover.clickCount / cover.viewCount) * 100).toFixed(1) })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <Divider />
              </>
            )}

            <div style={{ marginBottom: "0" }}>
              <SectionTitle>{t("dashboard.sharesSection")}</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
                <div>
                  <MiniTitle>{t("dashboard.topSharers")}</MiniTitle>
                  <RankList
                    items={shareLeaderboard.slice(0, 8)}
                    labelKey="username"
                    valueKey="shareCount"
                    color="#81c784"
                    emptyText={t("dashboard.noShares")}
                  />
                </div>
                <div>
                  <MiniTitle>{t("dashboard.sharesBySubject")}</MiniTitle>
                  {subjectAggregates.some((s) => s.avgShares > 0) ? (
                    <SimpleBar
                      data={subjectAggregates}
                      dataKey="avgShares"
                      height={200}
                      baseColor="#ffb74d"
                      dimColor="#7a5520"
                    />
                  ) : (
                    <p style={{ color: "#3a3a3a", fontSize: "13px" }}>{t("dashboard.noShares")}</p>
                  )}
                </div>
              </div>
            </div>

            {hasSubData && (
              <>
                <Divider />
                <div>
                  <SectionTitle>{t("dashboard.subscriptions")}</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
                    <div>
                      <MiniTitle>{t("dashboard.topSubscribers")}</MiniTitle>
                      <RankList items={subscriptions.topSubscribers.slice(0, 8)} labelKey="username" valueKey="count" color="#ffb74d" emptyText={t("dashboard.noDataYet")} />
                    </div>
                    <div>
                      <MiniTitle>{t("dashboard.topAuthors")}</MiniTitle>
                      <RankList items={subscriptions.topAuthors.slice(0, 8)} labelKey="authorUsername" valueKey="subscriptionCount" color="#ba68c8" emptyText={t("dashboard.noDataYet")} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;
