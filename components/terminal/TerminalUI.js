"use client";

import { useState } from "react";
import Link from "next/link";

export default function TerminalUI() {
  const [mode, setMode] = useState("WRITE_FILE");
  const [path, setPath] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("SYSTEM_READY");

  async function pushToSpine() {
    setStatus("UPLOADING_TO_SPINE...");

    try {
      const payload =
        mode === "WRITE_FILE"
          ? {
              mode: "WRITE_FILE",
              filePath: path,
              codeContent: code,
              commitMessage: "Manual update via Cipher Terminal",
            }
          : {
              mode: "FILESYSTEM",
              operation: "flatten",
              sourceDir: "Cipher_sim",
              commitMessage:
                "chore: flatten repo structure for Vercel compatibility",
            };

      const res = await fetch("/api/diag-spine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ UPDATE_SUCCESSFUL");
        setCode("");
        setPath("");
      } else {
        setStatus("❌ ERROR: " + (data?.error || "UNKNOWN_FAILURE"));
      }
    } catch (err) {
      console.error("TERMINAL ERROR:", err);
      setStatus("❌ CONNECTION_LOST");
    }
  }

  return (
    <div
      style={{
        background: "#000",
        color: "#0f0",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "monospace",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          borderBottom: "1px solid #0f0",
          paddingBottom: "10px",
        }}
      >
        <h2 style={{ margin: 0 }}>CIPHER_TERMINAL_V1.1</h2>
        <Link
          href="/"
          style={{
            color: "#0f0",
            textDecoration: "none",
            border: "1px solid #0f0",
            padding: "2px 8px",
          }}
        >
          RETURN_TO_CHAT
        </Link>
      </div>

      {/* STATUS */}
      <p style={{ background: "#111", padding: "8px" }}>
        STATUS: {status}
      </p>

      {/* MODE SELECT */}
      <div style={{ marginBottom: "20px" }}>
        <label>MODE:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{
            width: "100%",
            background: "#111",
            color: "#0f0",
            border: "1px solid #0f0",
            padding: "12px",
            marginTop: "5px",
          }}
        >
          <option value="WRITE_FILE">WRITE_FILE</option>
          <option value="FILESYSTEM">FILESYSTEM</option>
        </select>
      </div>

      {/* FILE PATH */}
      <div style={{ marginBottom: "20px" }}>
        <label>TARGET_FILE_PATH (disabled in FILESYSTEM mode):</label>
        <input
          disabled={mode === "FILESYSTEM"}
          style={{
            width: "100%",
            background: "#111",
            color: mode === "FILESYSTEM" ? "#555" : "#0f0",
            border: "1px solid #0f0",
            padding: "12px",
            marginTop: "5px",
          }}
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder={
            mode === "FILESYSTEM"
              ? "Not used in FILESYSTEM mode"
              : "Enter file path..."
          }
        />
      </div>

      {/* CODE INJECTION */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          {mode === "FILESYSTEM"
            ? "FILESYSTEM_OPERATION_PAYLOAD (ignored)"
            : "NEW_CODE_INJECTION:"}
        </label>
        <textarea
          style={{
            width: "100%",
            height: "350px",
            background: "#111",
            color: "#0f0",
            border: "1px solid #0f0",
            padding: "12px",
            marginTop: "5px",
          }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={
            mode === "FILESYSTEM"
              ? "Nothing required here for FILESYSTEM mode."
              : "Paste code here..."
          }
        />
      </div>

      {/* EXECUTE */}
      <button
        onClick={pushToSpine}
        style={{
          width: "100%",
          padding: "20px",
          background: "#0f0",
          color: "#000",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
        }}
      >
        EXECUTE_SPINE_INJECTION
      </button>
    </div>
  );
}
