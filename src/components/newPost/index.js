import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Cabecalho from "../Cabecalho";
import { authFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const parseWikilinks = (content) => {
  const regex = /\[\[([^\[\]]+)\]\]/g;
  const titles = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    titles.push(match[1].trim());
  }
  return [...new Set(titles)];
};

function NovoPost() {
  const navigate = useNavigate();
  const { username } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/posts/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => setSubjects(data));
  }, []);

  const handleSubjectChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setIsCreatingSubject(true);
      setSubject("");
    } else {
      setIsCreatingSubject(false);
      setSubject(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const body = {
      title,
      content,
      authorUsername: username,
      subject,
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
    width: "100%",
    background: "#1e1e1e",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "8px 12px",
    color: "#e0e0e0",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    color: "#888",
    fontSize: "12px",
    marginBottom: "6px",
    display: "block",
  };

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
            <div data-color-mode="dark">
              <MDEditor
                value={content}
                onChange={(v) => setContent(v || "")}
                height={400}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Categoria</label>
            {!isCreatingSubject ? (
              <select
                value={subject}
                onChange={handleSubjectChange}
                required
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Selecione uma categoria</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="new">+ Criar nova categoria</option>
              </select>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Nome da nova categoria"
                  required
                  style={inputStyle}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setIsCreatingSubject(false); setSubject(""); }}
                  style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "8px 12px", fontSize: "13px", whiteSpace: "nowrap" }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: "#4fc3f7",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: isSubmitting ? "default" : "pointer",
              }}
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
