import React, { useState } from "react";

function Post({ title, content, author, id, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Define o objeto do corpo da requisição
    const body = {
      id: id,
      title: editedTitle,
      content: editedContent,
      author: {
        username: author,
      },
      createdAt: "", // Pode ser preenchido se necessário
      links: [],
      subject:
        "Coisas que aconteceram até agora durante a implementação desse blog",
    };

    try {
      setIsSaving(true); // Indica que a requisição está em andamento

      const response = await fetch(
        "http://localhost:8080/api/posts/updatePost",
        {
          method: "PUT", // Use POST ou PUT, dependendo do endpoint
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao salvar o post");
      }

      // Sucesso ao salvar, sair do modo de edição
      setEditMode(false);
      alert("Post atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar o post:", error);
      alert("Erro ao salvar o post. Tente novamente.");
    } finally {
      setIsSaving(false); // Finaliza o estado de salvamento
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
      {/* Botão de Fechar */}
      <button
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
        onClick={onClose}
      >
        ❌
      </button>

      {/* Botão de Editar */}
      <button
        style={{
          position: "absolute",
          top: "13px",
          right: "40px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
        onClick={() => setEditMode(!editMode)}
      >
        ✏️
      </button>

      {editMode ? (
        // Modo de edição
        <>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              fontSize: "16px",
            }}
          />
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{
              width: "100%",
              height: "100px",
              padding: "10px",
              marginBottom: "10px",
              fontSize: "16px",
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </>
      ) : (
        // Modo de exibição
        <>
          <h2 style={{ marginBottom: "10px" }}>{editedTitle}</h2>
          <p style={{ marginBottom: "10px" }}>{editedContent}</p>
          <p style={{ fontStyle: "italic", color: "gray" }}>Autor: {author}</p>
        </>
      )}
    </div>
  );
}

export default Post;
