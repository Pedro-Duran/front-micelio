import React, { useState } from "react";
import { useTranslation } from "react-i18next";

function Post({ title, content, author, id, onClose }) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const body = {
      id: id,
      title: editedTitle,
      content: editedContent,
      author: { username: author },
      createdAt: "",
      links: [],
      subject: "Coisas que aconteceram até agora durante a implementação desse blog",
    };

    try {
      setIsSaving(true);
      const response = await fetch("/api/posts/updatePost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(t("post.saveError"));
      setEditMode(false);
      alert(t("post.saveSuccess"));
    } catch (error) {
      console.error(t("post.saveError"), error);
      alert(t("post.saveErrorDetail"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        width: "400px",
        padding: "20px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        borderRadius: "8px",
        position: "absolute",
        top: "10%",
        right: "10%",
        zIndex: 1000,
      }}
    >
      <button
        style={{ position: "absolute", top: "10px", right: "10px", border: "none", background: "transparent", cursor: "pointer" }}
        onClick={onClose}
      >
        ❌
      </button>
      <button
        style={{ position: "absolute", top: "13px", right: "40px", border: "none", background: "transparent", cursor: "pointer" }}
        onClick={() => setEditMode(!editMode)}
      >
        ✏️
      </button>

      {editMode ? (
        <>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", fontSize: "16px" }}
          />
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{ width: "100%", height: "100px", padding: "10px", marginBottom: "10px", fontSize: "16px" }}
          />
          <button
            onClick={handleSave}
            style={{ padding: "10px 20px", backgroundColor: "#4caf50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
            disabled={isSaving}
          >
            {isSaving ? t("post.saving") : t("post.save")}
          </button>
        </>
      ) : (
        <>
          <h2 style={{ marginBottom: "10px" }}>{editedTitle}</h2>
          <p style={{ marginBottom: "10px" }}>{editedContent}</p>
          <p style={{ fontStyle: "italic", color: "gray" }}>{t("post.author", { author })}</p>
        </>
      )}
    </div>
  );
}

export default Post;
