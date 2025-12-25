"use client";

import { useState } from "react";
import Link from "next/link";

export default function TerminalUI() {
  // --- CORE TERMINAL STATE ---
  const [mode, setMode] = useState("COMMAND");
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState("SYSTEM_READY");

  // --- LEGACY (kept for safety, not used now) ---
  const [path, setPath] = useState("");
  const [code, setCode] = useState("");

  // --- STEP 1: ASK SIVA TO PLAN ---
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

  // --- STEP 2: HUMAN APPROVAL → APPLY ---
  async function approveAndApply() {
    if (!plan || !plan.files) return;

    setStatus("SIVA_APPLYING...");

    try {
      const res = await fetch("/api/siva-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: plan.taskId || "TERMINAL_TASK",
          files: plan.files,
        }),
      });

      const data = await res.json();

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
        <h2 style={{ margin: 0 }}>CIPHER_TERMINAL_V2 — SIVA COMMAND</h2>
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

      {/* MODE */}
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
          <option value="COMMAND">COMMAND (SIVA)</option>
          <option value="LEGACY">LEGACY (DISABLED)</option>
        </select>
      </div>

      {/* COMMAND INPUT */}
      {mode === "COMMAND" && (
        <div style={{ marginBottom: "20px" }}>
          <label>SIVA COMMAND:</label>
          <textarea
            style={{
              width: "100%",
              height: "120px",
              background: "#111",
              color: "#0f0",
              border: "1px solid #0f0",
              padding: "12px",
              marginTop: "5px",
            }}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g. Siva build a settings UI with autonomy toggle"
          />

          <button
            onClick={runSivaPlan}
            style={{
              width: "100%",
              padding: "15px",
              background: "#0f0",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            RUN SIVA PLAN
          </button>
        </div>
      )}

      {/* PLAN PREVIEW + APPROVAL */}
      {plan && (
        <div
          style={{
            background: "#111",
            border: "1px solid #0f0",
            padding: "15px",
            marginTop: "20px",
          }}
        >
          <h3>🧠 SIVA PLAN</h3>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "13px",
              marginBottom: "15px",
            }}
          >
            {JSON.stringify(plan.files, null, 2)}
          </pre>

          <button
            onClick={approveAndApply}
            style={{
              width: "100%",
              padding: "15px",
              background: "#00ff99",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
            }}
          >
            APPROVE & APPLY
          </button>
        </div>
      )}
    </div>
  );
}
