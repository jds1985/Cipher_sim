"use client";

import { useState } from "react";
import Link from "next/link";

export default function TerminalUI() {
  const [mode, setMode] = useState("COMMAND");
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState("SYSTEM_READY");

  async function runSivaPlan() {
    if (!command.trim()) return;

    setStatus("SIVA_PLANNING...");
    setPlan(null);

    try {
      const res = await fetch("/api/siva-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: command,
          source: "terminal",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("❌ PLAN FAILED");
        return;
      }

      setPlan(data);
      setStatus("🧠 PLAN_READY");
    } catch (err) {
      console.error(err);
      setStatus("❌ CONNECTION_ERROR");
    }
  }

  async function approveAndApply() {
    if (!plan?.files?.length) return;

    setStatus("SIVA_APPLYING...");

    try {
      const res = await fetch("/api/siva-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: plan.taskId,
          files: plan.files,
        }),
      });

      if (!res.ok) {
        setStatus("❌ APPLY FAILED");
        return;
      }

      setStatus("✅ SIVA_COMMITTED");
      setCommand("");
      setPlan(null);
    } catch (err) {
      console.error(err);
      setStatus("❌ APPLY_CONNECTION_ERROR");
    }
  }

  return (
    <div style={{ background: "#000", color: "#0f0", minHeight: "100vh", padding: "20px", fontFamily: "monospace" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #0f0", paddingBottom: "10px" }}>
        <h2>CIPHER_TERMINAL_V2 — SIVA COMMAND</h2>
        <Link href="/" style={{ color: "#0f0", border: "1px solid #0f0", padding: "4px 10px" }}>
          RETURN_TO_CHAT
        </Link>
      </div>

      {/* STATUS */}
      <p style={{ background: "#111", padding: "8px", marginTop: "15px" }}>
        STATUS: {status}
      </p>

      {/* MODE */}
      <label>MODE:</label>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        style={{ width: "100%", background: "#111", color: "#0f0", border: "1px solid #0f0", padding: "12px" }}
      >
        <option value="COMMAND">COMMAND (SIVA)</option>
      </select>

      {/* COMMAND */}
      <label style={{ marginTop: "20px", display: "block" }}>SIVA COMMAND:</label>
      <textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="e.g. Siva build a settings page with autonomy toggle"
        style={{ width: "100%", height: "120px", background: "#111", color: "#0f0", border: "1px solid #0f0", padding: "12px" }}
      />

      <button
        onClick={runSivaPlan}
        style={{ width: "100%", marginTop: "10px", padding: "15px", background: "#0f0", color: "#000", fontWeight: "bold" }}
      >
        RUN SIVA PLAN
      </button>

      {/* DIFF PREVIEW */}
      {plan?.files && (
        <div style={{ marginTop: "30px", border: "1px solid #0f0", padding: "15px", background: "#050505" }}>
          <h3>🧠 SIVA PLAN (READ-ONLY)</h3>

          {plan.files.map((file, idx) => (
            <div key={idx} style={{ marginTop: "20px", border: "1px dashed #0f0", padding: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{file.path}</strong>
                <span style={{ color: file.action === "CREATE" ? "#00ff99" : "#ffaa00" }}>
                  {file.action}
                </span>
              </div>

              <p style={{ fontSize: "12px", opacity: 0.8 }}>{file.description}</p>

              <pre
                style={{
                  background: "#000",
                  padding: "10px",
                  fontSize: "12px",
                  maxHeight: "300px",
                  overflow: "auto",
                  border: "1px solid #033",
                }}
              >
{file.content}
              </pre>
            </div>
          ))}

          <button
            onClick={approveAndApply}
            style={{ width: "100%", marginTop: "20px", padding: "15px", background: "#00ff99", color: "#000", fontWeight: "bold" }}
          >
            APPROVE & APPLY
          </button>
        </div>
      )}
    </div>
  );
}
