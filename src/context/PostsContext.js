import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { parsePage } from "../utils/api";

const PostsContext = createContext(null);

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    fetch("/api/posts/verPosts")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((raw) => {
        const data = parsePage(raw).content;
        const writtenTitles = new Set(
          data.filter((p) => !p.isStub).map((p) => p.title?.toLowerCase().trim()).filter(Boolean)
        );
        const deduped = data.filter(
          (p) => !p.isStub || !writtenTitles.has(p.title?.toLowerCase().trim())
        );
        setPosts(deduped);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <PostsContext.Provider value={{ posts, loading, refresh: fetchPosts }}>
      {children}
    </PostsContext.Provider>
  );
}

export const usePosts = () => useContext(PostsContext);
