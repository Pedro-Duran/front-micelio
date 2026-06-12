import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "./components/Cabecalho";
import SubjectsSidebar from "./components/SubjectsSidebar";
import SubjectCard from "./components/SubjectCard";
import { authFetch, parsePage } from "./utils/api";
import { useAuth } from "./context/AuthContext";

function App() {
  const [groupedNodes, setGroupedNodes] = useState({});
  const [pinnedSubjects, setPinnedSubjects] = useState([]);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) { setPinnedSubjects([]); return; }
    authFetch("/api/users/subjects/pinned")
      .then((r) => r.ok ? r.json() : [])
      .catch(() => [])
      .then((data) => setPinnedSubjects(Array.isArray(data) ? data : []));
  }, [isLoggedIn]);

  useEffect(() => {
    Promise.all([
      fetch("/api/posts/verPosts").then((r) => {
        if (!r.ok) throw new Error("Erro ao buscar posts");
        return r.json();
      }).then((d) => parsePage(d).content),
      authFetch("/api/events/summary").then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([postsData, summaryData]) => {
      const vcMap = {};
      summaryData.forEach((s) => { vcMap[s.postId] = s.viewCount || 0; });

      const getSubjs = (p) => Array.isArray(p.subjects) && p.subjects.length > 0
        ? p.subjects : (p.subject ? [p.subject] : ["Sem categoria"]);

      const writtenTitles = new Set(
        postsData.filter((p) => !p.isStub).map((p) => p.title?.toLowerCase().trim()).filter(Boolean)
      );
      const dedupedPosts = postsData.filter(
        (p) => !p.isStub || !writtenTitles.has(p.title?.toLowerCase().trim())
      );

      let visiblePosts = dedupedPosts;
      if (!isLoggedIn) {
        const countByUser = {};
        dedupedPosts.forEach((p) => {
          if (!p.isStub) {
            const u = p.authorUsername || p.author?.username;
            if (u) countByUser[u] = (countByUser[u] || 0) + 1;
          }
        });
        const topUser = Object.entries(countByUser).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (topUser) {
          visiblePosts = dedupedPosts.filter((p) => {
            const u = p.authorUsername || p.author?.username;
            return u === topUser;
          });
        }
      }

      const nodes = visiblePosts.map((post) => {
        const subjs = getSubjs(post);
        return {
          id: post.id,
          title: post.title || "Título não disponível",
          content: post.content || "",
          subjects: subjs,
          subject: subjs[0] || "Sem categoria",
          isStub: post.isStub || false,
          subscribedByMe: post.subscribedByMe || false,
          viewCount: vcMap[post.id] || 0,
          coverImageUrl: post.coverImageUrl || null,
          authorUsername: post.authorUsername || post.author?.username || null,
        };
      });

      const links = [];
      visiblePosts.forEach((post) => {
        if (Array.isArray(post.links)) {
          post.links.forEach((linkedId) => links.push({ source: post.id, target: linkedId }));
        }
      });

      const grouped = {};
      nodes.forEach((node) => {
        node.subjects.forEach((s) => {
          if (!grouped[s]) grouped[s] = { nodes: [], links: [] };
          if (!grouped[s].nodes.find((n) => n.id === node.id)) grouped[s].nodes.push(node);
        });
      });

      Object.values(grouped).forEach((group) => {
        group.links = links.filter(
          (link) =>
            group.nodes.find((n) => n.id === link.source) &&
            group.nodes.find((n) => n.id === link.target)
        );
      });

      setGroupedNodes(grouped);
    }).catch((err) => console.error(err));
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", background: "#1e1e1e", minHeight: "calc(100vh - 60px)" }}>
        <SubjectsSidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            padding: "20px",
            alignContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          {Object.entries(groupedNodes)
            .sort(([a], [b]) => {
              const aPin = pinnedSubjects.indexOf(a);
              const bPin = pinnedSubjects.indexOf(b);
              const aPinned = aPin !== -1;
              const bPinned = bPin !== -1;
              if (aPinned && !bPinned) return -1;
              if (!aPinned && bPinned) return 1;
              if (aPinned && bPinned) return aPin - bPin;
              if (!isLoggedIn) {
                if (a === "Tutorial") return -1;
                if (b === "Tutorial") return 1;
              }
              return 0;
            })
            .map(([subject, { nodes, links }]) => (
              <SubjectCard
                key={subject}
                subject={subject}
                nodes={nodes}
                links={links}
                onNodeClick={(node) => navigate(`/post/${node.id}`)}
                overlay
              />
            ))}
        </div>
      </div>
    </>
  );
}

export default App;
