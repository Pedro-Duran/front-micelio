import React from "react";
import Card from "../card/Card";

function Post({ title, content, author, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10%",
        right: "10%",
        zIndex: 1000,
        width: "400px",
      }}
    >
      <Card title={title}>
        <p style={{ marginBottom: "10px" }}>{content}</p>
        <p style={{ fontStyle: "italic", color: "gray" }}>Autor: {author}</p>
        <button
          style={{
            marginTop: "10px",
            backgroundColor: "#ff4d4d",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          Fechar
        </button>
      </Card>
    </div>
  );
}

export default Post;
