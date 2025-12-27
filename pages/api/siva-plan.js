"use client";

import { useState } from "react";
import Link from "next/link";

export default function TerminalUI() {
  const [mode, setMode] = useState("COMMAND");
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState("SYSTEM_READY");
  const [diffs, setDiffs] = useState({});

  async function runSivaPlan() {
    if (!command.trim()) return;

    setStatus("SIVA_PLANNING...");
    setPlan(null);
    setDiffs({});

    try {
      const res = await fetch("/api/siva-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: command, source: "terminal" }),
      });

      const data = await res.json();
      if (!res.ok) return setStatus("❌ PLAN FAILED");

      const beforeMap = {};
      for (const file of data.files || []) {
        const r = await fetch(`/api/siva-read?path=${encodeURIComponent(file.path)}`);
        const before = await r.json();
        beforeMap[file.path] = before.exists
          ? before.content
          : "// FILE DOES NOT EXIST";
      }

      setDiffs(beforeMap);
      setPlan(data);
      setStatus(
        data.capabilities?.canApply
          ? "🧠 PLAN_READY — APPLY ENABLED"
          : "🧠 PLAN_READY — NO APPLY (DESIGN ONLY)"
      );
    } catch {
      setStatus("❌ CONNECTION_ERROR");
    }
  }

  async function approveAndApply() {
    if (!plan?.files?.length || !plan.capabilities?.canApply) return;

    setStatus("SIVA_APPLYING...");
    try {
      const res = await fetch("/api/siva-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: plan.taskId, files: plan.files }),
      });

      if (!res.ok) return setStatus("❌ APPLY FAILED");
      setStatus("✅ SIVA_COMMITTED");
      setCommand("");
      setPlan(null);
      setDiffs({});
    } catch {
      setStatus("❌ APPLY_CONNECTION_ERROR");
    }
  }

  return (
    <div
      style={{
        background: "#000",
        color: "#0f0",
        minHeight: "100vh",
        maxWidth: "100vw",
        overflowX: "hidden",
        padding: "20px",
        fontFamily: "monospace",
      }}
    >
      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #0f0",
        paddingBottom: "10px",
      }}>
        <h2>CIPHER_TERMINAL_V2 — SIVA COMMAND</h2>
        <Link href="/" style={{
          color: "#0f0",
          border: "1px solid #0f0",
          padding: "4px 10px",
          textDecoration: "none",
        }}>
          RETURN_TO_CHAT
        </Link>
      </div>

      {/* STATUS */}
      <p style={{
        background: "#050505",
        border: "1px solid #0f0",
        padding: "8px",
        marginTop: "15px",
      }}>
        STATUS: {status}
      </p>

      {/* COMMAND */}
      <textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Siva IMPLEMENT a settings page with autonomy toggle"
        style={{
          width: "100%",
          height: "120px",
          background: "#020202",
          color: "#0f0",
          border: "1px solid #0f0",
          padding: "12px",
          marginTop: "15px",
        }}
      />

      <button
        onClick={runSivaPlan}
        style={{
          width: "100%",
          marginTop: "12px",
          padding: "14px",
          background: "#0f0",
          color: "#000",
          fontWeight: "bold",
          border: "none",
        }}
      >
        RUN SIVA PLAN
      </button>

      {/* PLAN PREVIEW */}
      {plan?.files && (
        <div style={{
          marginTop: "25px",
          border: "1px solid #0f0",
          padding: "15px",
          background: "#020202",
        }}>
          <h3>🧠 SIVA PLAN — DIFF PREVIEW</h3>

          {plan.files.map((file, idx) => (
            <div key={idx} style={{
              marginTop: "20px",
              border: "1px dashed #0f0",
              padding: "10px",
            }}>
              <strong>{file.path}</strong>
              <p style={{ fontSize: "12px", opacity: 0.7 }}>
                {file.description}
              </p>

              {file.mode === "DESIGN_ONLY" && (
                <div style={{
                  background: "#110011",
                  color: "#ff77ff",
                  padding: "6px",
                  fontSize: "11px",
                  border: "1px solid #ff77ff",
                  marginBottom: "8px",
                }}>
                  DESIGN ONLY — No implementation content
                </div>
              )}

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
                <pre style={{
                  background: "#000",
                  padding: "10px",
                  fontSize: "11px",
                  border: "1px solid #300",
                  maxHeight: "200px",
                  overflow: "auto",
                }}>
{diffs[file.path]}
                </pre>

                <pre style={{
                  background: "#000",
                  padding: "10px",
                  fontSize: "11px",
                  border: "1px solid #030",
                  maxHeight: "200px",
                  overflow: "auto",
                }}>
{file.content || "// NO CONTENT (DESIGN ONLY)"}
                </pre>
              </div>
            </div>
          ))}

          {plan.capabilities?.canApply && (
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
