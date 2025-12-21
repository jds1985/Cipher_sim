import { useState } from "react";
import Link from "next/link";

export default function Terminal() {
  const [path, setPath] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("SYSTEM_READY");

  async function pushToSpine() {
    setStatus("UPLOADING_TO_SPINE...");
    try {
      const res = await fetch("/api/diag-spine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: path,
          codeContent: code,
          commitMessage: "Manual update via Cipher Terminal"
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("✅ UPDATE_SUCCESSFUL");
        setCode(""); // Clear code after success
      } else {
        setStatus("❌ ERROR: " + (data.error || "UNKNOWN_FAILURE"));
      }
    } catch (err) {
      setStatus("❌ CONNECTION_LOST");
    }
  }

  return (
    <div style={{ background: "#000", color: "#0f0", minHeight: "100vh", padding: "20px", fontFamily: "monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #0f0", paddingBottom: "10px" }}>
        <h2 style={{ margin: 0 }}>CIPHER_TERMINAL_V1</h2>
        <Link href="/" style={{ color: "#0f0", textDecoration: "none", border: "1px solid #0f0", padding: "2px 8px" }}>
          RETURN_TO_CHAT
        </Link>
      </div>
      
      <p style={{ background: "#111", padding: "5px" }}>STATUS: {status}</p>
      
      <div style={{ marginBottom: "20px" }}>
        <label>TARGET_FILE_PATH (e.g., components/chat/ChatPanel.jsx):</label><br/>
        <input 
          style={{ width: "100%", background: "#111", color: "#0f0", border: "1px solid #0f0", padding: "12px", marginTop: "5px" }}
          value={path} 
          onChange={(e) => setPath(e.target.value)} 
          placeholder="Enter path..."
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>NEW_CODE_INJECTION:</label><br/>
        <textarea 
          style={{ width: "100%", height: "350px", background: "#111", color: "#0f0", border: "1px solid #0f0", padding: "12px", marginTop: "5px" }}
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="Paste code here..."
        />
      </div>

      <button 
        onClick={pushToSpine}
        style={{ width: "100%", padding: "20px", background: "#0f0", color: "#000", fontWeight: "bold", border: "none", cursor: "pointer" }}
      >
        EXECUTE_SPINE_INJECTION
      </button>
    </div>
  );
}