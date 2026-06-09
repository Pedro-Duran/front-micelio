import React, { useState } from "react";

function WikilinkSubjectsModal({ wikilinks, defaultSubjects, allSubjects, confirmLabel, onConfirm, onCancel }) {
  const [assignments, setAssignments] = useState(() =>
    Object.fromEntries(wikilinks.map((t) => [t, [...defaultSubjects]]))
  );

  const toggle = (title, subject) => {
    setAssignments((prev) => {
      const cur = prev[title] || [];
      return {
        ...prev,
        [title]: cur.includes(subject) ? cur.filter((s) => s !== subject) : [...cur, subject],
      };
    });
  };

  const handleConfirm = () => {
    onConfirm(wikilinks.map((t) => ({ title: t, subjects: assignments[t] || defaultSubjects })));
  };

  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#242424", border: "1px solid #333", borderRadius: "8px", width: "440px", maxHeight: "520px", display: "flex", flexDirection: "column", padding: "24px", gap: "16px" }}
      >
        <div>
          <h3 style={{ margin: "0 0 6px", color: "#e0e0e0", fontSize: "15px" }}>Categorias dos stubs</h3>
          <p style={{ margin: 0, color: "#555", fontSize: "12px" }}>
            Os [[links]] abaixo criarão novos posts. Defina as categorias de cada um.
          </p>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
          {wikilinks.map((title) => (
            <div key={title} style={{ borderBottom: "1px solid #2a2a2a", paddingBottom: "12px" }}>
              <span style={{ color: "#4fc3f7", fontSize: "13px", fontFamily: "monospace" }}>[[{title}]]</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {allSubjects.map((s) => {
                  const sel = (assignments[title] || []).includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggle(title, s)}
                      style={{
                        background: sel ? "#1d3a4a" : "none",
                        border: `1px solid ${sel ? "#4fc3f7" : "#444"}`,
                        borderRadius: "20px",
                        color: sel ? "#4fc3f7" : "#666",
                        padding: "3px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleConfirm}
            style={{ flex: 1, background: "#4fc3f7", color: "#000", border: "none", borderRadius: "4px", padding: "9px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
          >
            {confirmLabel || "Confirmar"}
          </button>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "1px solid #444", borderRadius: "4px", color: "#888", cursor: "pointer", padding: "9px 18px", fontSize: "13px" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default WikilinkSubjectsModal;
