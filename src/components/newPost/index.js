import React, { useState } from "react";
import Cabecalho from "../cabecalho/cabecalho";

function NovoPost() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: { username: "" },
    links: [],
    subject: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Atualiza o campo do autor corretamente
    if (name === "username") {
      setFormData((prev) => ({
        ...prev,
        author: { ...prev.author, username: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:8080/api/posts/createPost",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao criar o post.");
      }

      alert("Post criado com sucesso!");
      setFormData({
        title: "",
        content: "",
        author: { username: "" },
        links: [],
        subject: "",
      });
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao criar o post.");
    }
  };

  return (
    <>
      <Cabecalho />
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h2>Criar Novo Post</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label>Título:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Conteúdo:</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px" }}
            ></textarea>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Autor:</label>
            <input
              type="text"
              name="username"
              value={formData.author.username}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Categoria (Subject):</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: "#1e1e1e",
              color: "#fff",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Criar Post
          </button>
        </form>
      </div>
    </>
  );
}

export default NovoPost;
