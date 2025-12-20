import { useState } from "react";

export default function Terminal() {
  const [path, setPath] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Idle");

  async function pushToSpine() {
    setStatus("Syncing with Spine...");
    try {
      const res = await fetch("/api/diag-spine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: path,
          codeContent: code,
          commitMessage: "Manual Phone Update via Terminal"
        }),
      });
      const data = await res.json();
      setStatus(data.status === "Success" ? "✅ Success" : "❌ " + data.error);
    } catch (err) {
      setStatus("❌ Connection Error");
    }
  }

  return (
    <div style={{ background: "#000", color: "#0f0", minHeight: "100vh", padding: "20px", fontFamily: "monospace" }}>
      <h2>CIPHER_TERMINAL_V1</h2>
      <p>Status: {status}</p>
      
      <div style={{ marginBottom: "20px" }}>
        <label>FILE PATH (e.g., components/ChatPanel.jsx):</label><br/>
        <input 
          style={{ width: "100%", background: "#111", color: "#0f0", border: "1px solid #0f0", padding: "10px" }}
          value={path} 
          onChange={(e) => setPath(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>CODE CONTENT:</label><br/>
        <textarea 
          style={{ width: "100%", height: "300px", background: "#111", color: "#0f0", border: "1px solid #0f0", padding: "10px" }}
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
        />
      </div>

      <button 
        onClick={pushToSpine}
        style={{ width: "100%", padding: "15px", background: "#0f0", color: "#000", fontWeight: "bold", border: "none" }}
      >
        INITIATE SPINE UPDATE
      </button>
    </div>
  );
}
