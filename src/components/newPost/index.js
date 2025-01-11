import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cabecalho from "../Cabecalho";

function NovoPost() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: { username: "" },
    links: "",
    subject: "",
  });

  const [subjects, setSubjects] = useState([]); // Para armazenar os valores do dropdown
  const [postOptions, setPostOptions] = useState(null); // Para armazenar os posts retornados pelo endpoint
  const [selectedSubject, setSelectedSubject] = useState(""); // Para rastrear o subject selecionado
  const [isCreatingSubject, setIsCreatingSubject] = useState(false); // Para rastrear se o usuário está criando um novo subject

  // Buscar os subjects ao carregar a página
  useEffect(() => {
    fetch("http://localhost:8080/api/posts/subjects")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar subjects");
        }
        return response.json();
      })
      .then((data) => setSubjects(data))
      .catch((error) => console.error(error));
  }, []);

  const handleSubjectChange = (e) => {
    const value = e.target.value;

    if (value === "new") {
      setIsCreatingSubject(true); // Ativa o modo de criação de subject
      setFormData((prev) => ({ ...prev, subject: "" })); // Limpa o valor do subject
    } else {
      setIsCreatingSubject(false); // Desativa o modo de criação
      setFormData((prev) => ({ ...prev, subject: value }));
      setSelectedSubject(value);

      // Faz a requisição ao endpoint para obter posts relacionados ao subject selecionado
      fetch(
        `http://localhost:8080/api/posts/postsIdForThisSubject?subject=${value}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro ao buscar posts por subject");
          }
          return response.json();
        })
        .then((data) => setPostOptions(data))
        .catch((error) => console.error(error));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

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

    const processedFormData = {
      ...formData,
      links: formData.links.split(",").map((id) => id.trim()), // Processar os links como array
    };

    try {
      const response = await fetch(
        "http://localhost:8080/api/posts/createPost",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processedFormData),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao criar o post.");
      }

      alert("Post criado com sucesso!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao criar o post.");
    }
  };

  return (
    <>
      <Cabecalho />
      <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
        <div style={{ flex: 1, maxWidth: "600px" }}>
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
              <label>Links (IDs separados por vírgulas):</label>
              <input
                type="text"
                name="links"
                value={formData.links}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Categoria (Subject):</label>
              {!isCreatingSubject ? (
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleSubjectChange}
                  style={{ width: "100%", padding: "8px" }}
                >
                  <option value="">Selecione uma categoria</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                  <option value="new">Criar Novo Subject</option>
                </select>
              ) : (
                <input
                  type="text"
                  name="subject"
                  placeholder="Digite o novo subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px" }}
                />
              )}
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

        {/* Exibir os posts disponíveis ao lado do formulário */}
        {postOptions && (
          <div style={{ flex: 1 }}>
            <h3>Posts Disponíveis:</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {Object.entries(postOptions).map(([id, title]) => (
                <div
                  key={id}
                  style={{
                    padding: "10px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                  }}
                >
                  <strong>ID:</strong> {id} <br />
                  <strong>Título:</strong> {title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default NovoPost;
