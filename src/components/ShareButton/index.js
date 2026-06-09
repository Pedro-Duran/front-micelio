import React, { useState } from "react";
import { registerEvent } from "../../utils/analytics";

function ShareButton({ postId, username }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const makeUrl = (utmSource) => {
    const params = new URLSearchParams();
    if (username) params.set("ref", username);
    params.set("utm_source", utmSource);
    return `${window.location.origin}/post/${postId}?${params.toString()}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(makeUrl("copy"));
    } catch {
      // fallback for browsers that deny clipboard
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
    registerEvent({ postId, eventType: "SHARE", utmSource: "copy", username });
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(makeUrl("whatsapp"))}`, "_blank");
    setOpen(false);
    registerEvent({ postId, eventType: "SHARE", utmSource: "whatsapp", username });
  };

  return (
    <div style={{ position: "relative" }}>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100 }}
        />
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "1px solid #333",
          borderRadius: "4px",
          color: copied ? "#81c784" : "#666",
          cursor: "pointer",
          fontSize: "11px",
          padding: "3px 8px",
          whiteSpace: "nowrap",
          transition: "color 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!copied) { e.currentTarget.style.color = "#4fc3f7"; e.currentTarget.style.borderColor = "#4fc3f7"; }
        }}
        onMouseLeave={(e) => {
          if (!copied) { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#333"; }
        }}
      >
        {copied ? "Copiado!" : "Compartilhar"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 101,
            background: "#242424",
            border: "1px solid #333",
            borderRadius: "6px",
            minWidth: "160px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "#ccc",
              cursor: "pointer",
              fontSize: "13px",
              padding: "10px 14px",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#2e2e2e"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <span style={{ fontSize: "14px" }}>🔗</span> Copiar link
          </button>
          <div style={{ height: "1px", background: "#2a2a2a" }} />
          <button
            onClick={handleWhatsApp}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "#ccc",
              cursor: "pointer",
              fontSize: "13px",
              padding: "10px 14px",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#2e2e2e"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <span style={{ fontSize: "14px" }}>💬</span> WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}

export default ShareButton;
