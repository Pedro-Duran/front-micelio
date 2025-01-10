import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App"; // Página principal com o gráfico
import NovoPost from "./components/newPost"; // Página de formulário "Novo Post"

function MainRouter() {
  return (
    <Router>
      <Routes>
        {/* Rota para a página principal */}
        <Route path="/" element={<App />} />

        {/* Rota para criar um novo post */}
        <Route path="/novoPost" element={<NovoPost />} />
      </Routes>
    </Router>
  );
}

export default MainRouter;
