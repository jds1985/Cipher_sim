import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseClient";

export default function Success() {

  const [isPro, setIsPro] = useState(null);
  const [plan, setPlan] = useState("pro"); // ✅ ADDED

  useEffect(() => {
    if (typeof window !== "undefined") { // ✅ FIXED
      const urlPlan = new URLSearchParams(window.location.search).get("plan");
      if (urlPlan) setPlan(urlPlan); // ✅ ADDED
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const sessionId = new URLSearchParams(window.location.search).get("session_id");
      if (!sessionId) return;

      fetch("/api/verify-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userId: user.uid, // ✅ FIXED: guaranteed user
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem("isPro", "true");
            setIsPro("true");
          }
        });
    });

    return () => unsubscribe();
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
      <h1>
        🚀 {plan === "builder" ? "Welcome to Cipher Builder" : "Welcome to Cipher Pro"}
      </h1>
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
