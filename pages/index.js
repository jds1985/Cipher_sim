import { useState, useEffect } from "react";
import dynamic from "next/dynamic"; // Added to handle browser-only packages
import EntryScreen from "../components/EntryScreen";

// FORCE CHATPANEL TO LOAD CLIENT-SIDE ONLY (Bypasses Vercel's server build crash)
const ChatPanel = dynamic(() => import("../components/chat/ChatPanel"), {
  ssr: false,
});

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("cipherEntered");
    if (seen === "true") {
      setEntered(true);
    }
    setReady(true);
  }, []);

  const handleEnter = () => {
    // Start loading animation
    setLoading(true);

    // Simulate OS boot delay
    setTimeout(() => {
      localStorage.setItem("cipherEntered", "true");
      setEntered(true);
      setLoading(false);
    }, 1800); // 1.8 second boot sequence
  };

  if (!ready) return null;

  if (
    !entered &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/success.html"
  ) {
    return <EntryScreen onEnter={handleEnter} loading={loading} />;
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "#05050b",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ChatPanel />
    </div>
  );
}
