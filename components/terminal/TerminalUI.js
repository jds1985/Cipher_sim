"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function TerminalUI() {
  const [mode, setMode] = useState("COMMAND");
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState("SYSTEM_READY");
  const [diffs, setDiffs] = useState({});

  // 🖤 DERIVE APPLY-ELIGIBLE FILES (THE MISSING LINK)
  const applyEligibleFiles = useMemo(() => {
    if (!plan?.capabilities?.canApply) return [];
    return (plan.files || []).filter(
      (f) => f.mode === "FULL_CONTENT" && typeof f.content === "string"
    );
  }, [plan]);

  // ─────────────────────────────
  // STEP 1: PLAN
  // ─────────────────────────────
  async function runSivaPlan() {
    if (!command.trim()) return;

    setStatus("SIVA_PLANNING...");
    setPlan(null);
    setDiffs({});

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

      const beforeMap = {};

      for (const file of data.files || []) {
        const r = await fetch(
          `/api/siva-read?path=${encodeURIComponent(file.path)}`
        );
        const before = await r.json();

        beforeMap[file.path] = before.exists
          ? before.content
          : "// FILE DOES NOT EXIST";
      }

      setDiffs(beforeMap);
      setPlan(data);

      setStatus(
        data.capabilities?.canApply
          ? "🧠 PLAN_READY — APPLY AVAILABLE"
          : "🧠 PLAN_READY — NO APPLY (DESIGN ONLY)"
      );
    } catch (err) {
      console.error(err);
      setStatus("❌ CONNECTION_ERROR");
    }
  }

  // ─────────────────────────────
  // STEP 2: APPLY
  // ─────────────────────────────
  async function approveAndApply() {
    if (!applyEligibleFiles.length) {
      setStatus("⚠️ NOTHING TO APPLY");
      return;
    }

    setStatus("SIVA_APPLYING...");

    try {
      const res = await fetch("/api/siva-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: plan.taskId,
          files: applyEligibleFiles,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        setStatus("❌ APPLY FAILED");
        return;
      }

      setStatus("✅ SIVA_COMMITTED");
      setCommand("");
      setPlan(null);
      setDiffs({});
    } catch (err) {
      console.error(err);
      setStatus("❌ APPLY CONNECTION ERROR");
    }
  }

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #0f0",
          paddingBottom: "10px",
        }}
      >
        <h2>CIPHER_TERMINAL_V2 — SIVA COMMAND</h2>
        <Link
          href="/"
          style={{
            color: "#0f0",
            border: "1px solid #0f0",
            padding: "4px 10px",
            textDecoration: "none",
          }}
        >
          RETURN_TO_CHAT
        </Link>
      </div>

      <p style={{ background: "#111", padding: "8px", marginTop: "15px" }}>
        STATUS: {status}
      </p>

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
        }}
      >
        <option value="COMMAND">COMMAND (SIVA)</option>
      </select>

      <label style={{ marginTop: "20px", display: "block" }}>
        SIVA COMMAND:
      </label>
      <textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Siva IMPLEMENT a settings page with autonomy toggle"
        style={{
          width: "100%",
          height: "120px",
          background: "#111",
          color: "#0f0",
          border: "1px solid #0f0",
          padding: "12px",
        }}
      />

      <button
        onClick={runSivaPlan}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "15px",
          background: "#0f0",
          color: "#000",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
        }}
      >
        RUN SIVA PLAN
      </button>

      {plan?.files && (
        <div
          style={{
            marginTop: "30px",
            border: "1px solid #0f0",
            padding: "15px",
            background: "#050505",
          }}
        >
          <h3>🧠 SIVA PLAN — DIFF PREVIEW</h3>

          {plan.files.map((file, idx) => (
            <div
              key={idx}
              style={{
                marginTop: "20px",
                border: "1px dashed #0f0",
                padding: "10px",
              }}
            >
              <strong>{file.path}</strong>
              <pre style={{ fontSize: "11px", marginTop: "10px" }}>
{file.content || "// DESIGN ONLY"}
              </pre>
            </div>
          ))}

          {applyEligibleFiles.length > 0 && (
            <button
              onClick={approveAndApply}
              style={{
                width: "100%",
                marginTop: "20px",
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
          )}
        </div>
      )}
    </div>
  );
}
