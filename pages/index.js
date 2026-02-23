import { useState, useEffect } from "react";
import ChatPanel from "../components/chat/ChatPanel";
import EntryScreen from "../components/EntryScreen";

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

  if (!entered) {
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
