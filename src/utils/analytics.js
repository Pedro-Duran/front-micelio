const getSessionId = () => {
  let sessionId = sessionStorage.getItem("micelio_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("micelio_session_id", sessionId);
  }
  return sessionId;
};

const MIN_VIEW_DURATION_S = 10;

export const registerEvent = ({ postId, eventType, duration }) => {
  if (eventType === "VIEW" && (duration ?? 0) < MIN_VIEW_DURATION_S) return;

  const body = JSON.stringify({
    postId,
    eventType,
    sessionId: getSessionId(),
    duration: duration ?? null,
  });

  // keepalive garante o envio mesmo quando o componente desmonta durante navegação
  fetch("/api/events/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
};
