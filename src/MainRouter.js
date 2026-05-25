import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import App from "./App";
import NovoPost from "./components/newPost";
import PostPage from "./components/PostPage";
import SubjectPage from "./components/SubjectPage";
import Dashboard from "./components/Dashboard";
import Timeline from "./components/Timeline";
import Login from "./components/Login";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function MainRouter() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/subject/:name" element={<SubjectPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/login" element={<Login />} />
          <Route path="/novoPost" element={<ProtectedRoute><NovoPost /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default MainRouter;
