import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PostsProvider } from "./context/PostsContext";
import App from "./App";
import NovoPost from "./components/newPost";
import PostPage from "./components/PostPage";
import SubjectPage from "./components/SubjectPage";
import Dashboard from "./components/Dashboard";
import Timeline from "./components/Timeline";
import Login from "./components/Login";
import FeedPage from "./components/FeedPage";
import UserProfile from "./components/UserProfile";
import UsersPage from "./components/UsersPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import OAuth2CallbackPage from "./components/OAuth2CallbackPage";
import SearchPage from "./components/SearchPage";
import MarkdownTutorial from "./components/MarkdownTutorial";
import PostGraphEmbed from "./components/PostGraphEmbed";
import GraphPreferences from "./components/GraphPreferences";
import MobileBlock from "./components/MobileBlock";
import { isMobileDevice } from "./utils/isMobile";
import { NotificationsProvider } from "./context/NotificationsContext";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function MainRouter() {
  if (isMobileDevice()) return <MobileBlock />;

  return (
    <AuthProvider>
      <PostsProvider>
      <NotificationsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/subject/:name" element={<SubjectPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/login" element={<Login />} />
          <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/novoPost" element={<ProtectedRoute><NovoPost /></ProtectedRoute>} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tutorial/markdown" element={<MarkdownTutorial />} />
          <Route path="/post/:id/graph" element={<PostGraphEmbed />} />
          <Route path="/graph-preferences" element={<ProtectedRoute><GraphPreferences /></ProtectedRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
        </Routes>
      </Router>
      </NotificationsProvider>
      </PostsProvider>
    </AuthProvider>
  );
}

export default MainRouter;
