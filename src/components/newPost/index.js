import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Cabecalho from "../Cabecalho";
import WikilinkSubjectsModal from "../WikilinkSubjectsModal";
import { authFetch, authFetchMultipart } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const refTitle = location.state?.refTitle || null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(() => refTitle ? makeRefTemplate(refTitle) : "");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectError, setSubjectError] = useState(false);
  const [pendingWikilinks, setPendingWikilinks] = useState(null);

  const imageInputRef = useRef(null);
  const editorApiRef = useRef(null);

  const imageUploadCommand = {
    name: "upload-image",
    keyCommand: "upload-image",
    buttonProps: { "aria-label": "Upload image" },
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
      </svg>
    ),
    execute: (_state, api) => {
      editorApiRef.current = api;
      imageInputRef.current?.click();
    },
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await authFetchMultipart("/api/posts/images", formData);
      if (!res.ok) throw new Error();
      const data = await res.json();
      editorApiRef.current?.replaceSelection(`![${file.name}](${data.url})`);
    } catch {
      alert(t("postPage.imageError"));
    } finally {
      e.target.value = "";
    }
  };

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (!imageItem) return;
      if (!document.activeElement?.closest?.(".w-md-editor")) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await authFetchMultipart("/api/posts/images", formData);
        if (!res.ok) throw new Error();
        const data = await res.json();
        document.execCommand("insertText", false, `![image](${data.url})`);
      } catch {
        alert(t("postPage.imageError"));
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/posts/subjects")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => setAllSubjects(data));
  }, []);

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

  const doSubmit = async (wikilinkAssignments) => {
    setPendingWikilinks(null);
    setIsSubmitting(true);
    const body = {
      title,
      content,
      authorUsername: username,
      subjects: selectedSubjects,
      links: [],
      wikilinks: wikilinkAssignments,
    };
    try {
      const response = await authFetch("/api/posts/createPost", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(t("newPost.createError"));
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(t("newPost.createErrorDetail"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSubjects.length === 0) { setSubjectError(true); setShowSubjectModal(true); return; }
    setSubjectError(false);

    const detected = parseWikilinks(content);
    if (detected.length > 0) {
      setPendingWikilinks(detected);
      return;
    }
    await doSubmit([]);
  };

  const inputStyle = {
    width: "100%", background: "#1e1e1e", border: "1px solid #444",
    borderRadius: "4px", padding: "8px 12px", color: "#e0e0e0",
    fontSize: "14px", boxSizing: "border-box",
  };
  const labelStyle = { color: "#888", fontSize: "12px", marginBottom: "6px", display: "block" };

  return (
    <>
      {pendingWikilinks && (
        <WikilinkSubjectsModal
          wikilinks={pendingWikilinks}
          defaultSubjects={selectedSubjects}
          allSubjects={allSubjects}
          confirmLabel={t("newPost.confirmPublish")}
          onConfirm={(assignments) => doSubmit(assignments)}
          onCancel={() => setPendingWikilinks(null)}
        />
      )}
      {showSubjectModal && (
        <div
          onClick={() => setShowSubjectModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#242424", border: "1px solid #333", borderRadius: "8px", width: "380px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: "15px" }}>{t("newPost.selectCategories")}</h3>

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
                placeholder={t("newPost.newCategory")}
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
              {t("newPost.confirm")}
            </button>
          </div>
        </div>
      )}

      <Cabecalho />
      <div style={{ background: "#1e1e1e", minHeight: "calc(100vh - 60px)", padding: "40px 60px", color: "#e0e0e0" }}>
        <h1 style={{ fontSize: "22px", marginTop: 0, marginBottom: "32px" }}>{t("newPost.title")}</h1>

        <form onSubmit={handleSubmit} style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "20px" }}>

          <div>
            <label style={labelStyle}>{t("newPost.titlePlaceholder")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ ...inputStyle, fontSize: "18px", padding: "10px 12px" }}
            />
          </div>

          <div>
            <label style={labelStyle}>{t("newPost.contentPlaceholder")}</label>
            {refTitle && (
              <p style={{ margin: "0 0 8px", padding: "8px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#666", fontSize: "12px" }}>
                {t("newPost.preInsertedRef", { text: refTitle })}
              </p>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            <div data-color-mode="dark">
              <MDEditor
                value={content}
                onChange={(v) => {
                  if ((!v || v === "") && refTitle) setContent(makeRefTemplate(refTitle));
                  else setContent(v || "");
                }}
                height={400}
                extraCommands={[imageUploadCommand]}
              />
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, color: subjectError ? "#f44336" : "#888" }}>
              {subjectError ? t("newPost.categoriesRequired") : t("newPost.categories")}
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
                {t("newPost.addCategory")}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "14px", fontWeight: "bold", cursor: isSubmitting ? "default" : "pointer" }}
            >
              {isSubmitting ? t("newPost.publishing") : t("newPost.publish")}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "10px 20px", fontSize: "14px" }}
            >
              {t("common.cancel")}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}

export default NovoPost;
