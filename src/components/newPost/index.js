import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Cabecalho from "../Cabecalho";
import { authFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const parseWikilinks = (content) => {
  const regex = /\[\[([^\[\]]+)\]\]/g;
  const titles = [];
  let match;
  while ((match = regex.exec(content)) !== null) titles.push(match[1].trim());
  return [...new Set(titles)];
};

const makeRefTemplate = (refTitle) =>
  `Esse post faz referência a [[${refTitle}]].\n\n> Mova \`[[${refTitle}]]\` para onde quiser no texto. Delete este bloco de instrução quando começar a escrever.`;

function NovoPost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useAuth();

  const refTitle = location.state?.refTitle || null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(() => refTitle ? makeRefTemplate(refTitle) : "");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectError, setSubjectError] = useState(false);

  useEffect(() => {
    fetch("/api/posts/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => setAllSubjects(data));
  }, []);

  // Auto-open subject modal when coming from ref post
  useEffect(() => {
    if (refTitle) setShowSubjectModal(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSubject = (s) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addNewSubject = () => {
    const s = newSubjectInput.trim();
    if (!s) return;
    if (!selectedSubjects.includes(s)) setSelectedSubjects((prev) => [...prev, s]);
    if (!allSubjects.includes(s)) setAllSubjects((prev) => [...prev, s]);
    setNewSubjectInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSubjects.length === 0) { setSubjectError(true); setShowSubjectModal(true); return; }
    setSubjectError(false);
    setIsSubmitting(true);

    const body = {
      title,
      content,
      authorUsername: username,
      subjects: selectedSubjects,
      links: [],
      wikilinks: parseWikilinks(content),
    };

    try {
      const response = await authFetch("/api/posts/createPost", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Erro ao criar o post.");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao criar o post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#1e1e1e", border: "1px solid #444",
    borderRadius: "4px", padding: "8px 12px", color: "#e0e0e0",
    fontSize: "14px", boxSizing: "border-box",
  };
  const labelStyle = { color: "#888", fontSize: "12px", marginBottom: "6px", display: "block" };

  return (
    <>
      {/* Subject modal */}
      {showSubjectModal && (
        <div
          onClick={() => setShowSubjectModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#242424", border: "1px solid #333", borderRadius: "8px", width: "380px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: "15px" }}>Selecionar categorias</h3>

            {allSubjects.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {allSubjects.map((s) => {
                  const sel = selectedSubjects.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSubject(s)}
                      style={{
                        background: sel ? "#1d3a4a" : "none",
                        border: `1px solid ${sel ? "#4fc3f7" : "#444"}`,
                        borderRadius: "20px", color: sel ? "#4fc3f7" : "#666",
                        padding: "5px 14px", fontSize: "12px", cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewSubject(); } }}
                placeholder="Nova categoria..."
                style={{ flex: 1, background: "#1e1e1e", border: "1px solid #444", borderRadius: "4px", padding: "6px 10px", color: "#e0e0e0", fontSize: "13px", outline: "none" }}
              />
              <button
                onClick={addNewSubject}
                style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
              >
                +
              </button>
            </div>

            <button
              onClick={() => setShowSubjectModal(false)}
              style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      <Cabecalho />
      <div style={{ background: "#1e1e1e", minHeight: "calc(100vh - 60px)", padding: "40px 60px", color: "#e0e0e0" }}>
        <h1 style={{ fontSize: "22px", marginTop: 0, marginBottom: "32px" }}>Novo post</h1>

        <form onSubmit={handleSubmit} style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "20px" }}>

          <div>
            <label style={labelStyle}>Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ ...inputStyle, fontSize: "18px", padding: "10px 12px" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Conteúdo — use [[título]] para linkar outros posts</label>
            {refTitle && (
              <p style={{ margin: "0 0 8px", padding: "8px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#666", fontSize: "12px" }}>
                Referência pré-inserida: <span style={{ color: "#4fc3f7", fontFamily: "monospace" }}>[[{refTitle}]]</span> — mova-a para onde quiser no texto.
              </p>
            )}
            <div data-color-mode="dark">
              <MDEditor
                value={content}
                onChange={(v) => {
                  if ((!v || v === "") && refTitle) setContent(makeRefTemplate(refTitle));
                  else setContent(v || "");
                }}
                height={400}
              />
            </div>
          </div>

          {/* Subjects */}
          <div>
            <label style={{ ...labelStyle, color: subjectError ? "#f44336" : "#888" }}>
              Categorias{subjectError && " — selecione pelo menos uma"}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              {selectedSubjects.map((s) => (
                <span
                  key={s}
                  style={{ background: "#1d3a4a", color: "#4fc3f7", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #2a5a72" }}
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSelectedSubjects((prev) => prev.filter((x) => x !== s))}
                    style={{ background: "none", border: "none", color: "#4fc3f7", cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => { setSubjectError(false); setShowSubjectModal(true); }}
                style={{
                  background: "none",
                  border: `1px dashed ${subjectError ? "#f44336" : "#444"}`,
                  borderRadius: "20px", color: subjectError ? "#f44336" : "#555",
                  padding: "4px 12px", fontSize: "12px", cursor: "pointer",
                }}
              >
                + Adicionar categoria
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "14px", fontWeight: "bold", cursor: isSubmitting ? "default" : "pointer" }}
            >
              {isSubmitting ? "Publicando..." : "Publicar"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "10px 20px", fontSize: "14px" }}
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </>
  );
}

export default NovoPost;
