import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseClient";

export default function Success() {

  const [isPro, setIsPro] = useState(null);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");

    if (!sessionId) return;

    fetch("/api/verify-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        userId: auth.currentUser?.uid,
      })
    }) // ✅ THIS WAS MISSING
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem("isPro", "true");
          setIsPro("true");
        }
      });
  }, []);

  useEffect(() => {
    // Load existing state safely
    if (typeof window !== "undefined") {
      setIsPro(localStorage.getItem("isPro"));
    }
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
      <p>Pro Status: {isPro}</p>
  
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
