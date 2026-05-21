import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import NovoPost from "./components/newPost";
import PostPage from "./components/PostPage";
import Dashboard from "./components/Dashboard";

function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/novoPost" element={<NovoPost />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default MainRouter;
