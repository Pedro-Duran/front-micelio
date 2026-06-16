import React from "react";

function MobileBlock() {
  return (
    <div
      style={{
        background: "#1e1e1e",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#888", fontSize: "16px", lineHeight: "1.6", maxWidth: "320px", margin: 0 }}>
        A experiência desse blog foi projetada para computadores, acesse o puredo no PC para interagir com bagunças mentais organizadas.
      </p>
    </div>
  );
}

export default MobileBlock;
