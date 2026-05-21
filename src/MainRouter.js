import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import NovoPost from "./components/newPost";
import PostPage from "./components/PostPage";
import Dashboard from "./components/Dashboard";
import Timeline from "./components/Timeline";

function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/novoPost" element={<NovoPost />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/timeline" element={<Timeline />} />
      </Routes>
    </Router>
  );
}

export default MainRouter;
