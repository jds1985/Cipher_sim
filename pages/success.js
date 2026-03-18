import { useEffect } from "react";

export default function Success() {

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");

    if (!sessionId) return;

    fetch("/api/verify-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("isPro", "true");
      }
    });
  }, []);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#0a0a12",
      color: "white",
      textAlign: "center"
    }}>
      <h1>🚀 Welcome to Cipher Pro</h1>
      <p>Your subscription is active.</p>

      <button
        onClick={() => (window.location.href = "/")}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          borderRadius: 8,
          background: "#9d7bff",
          border: "none",
          color: "white",
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        Enter Cipher
      </button>
    </div>
  );
}
