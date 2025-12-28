"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function TerminalUI() {
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState(null);
  const [sandbox, setSandbox] = useState(null);
  const [status, setStatus] = useState("SYSTEM_READY");

  // Files eligible for APPLY (derived from plan)
  const applyEligibleFiles = useMemo(() => {
    if (!plan?.capabilities?.canApply) return [];
    return (plan.files || []).filter(
      (f) => f.mode === "FULL_CONTENT" && typeof f.content === "string"
    );
  }, [plan]);

  // ─────────────────────────────
  // RUN PLAN + SANDBOX
  // ─────────────────────────────
  async function runSivaPlan() {
    if (!command.trim()) return;

    setStatus("SIVA_PLANNING...");
    setPlan(null);
    setSandbox(null);

    // 1️⃣ PLAN
    const res = await fetch("/api/siva-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: command }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus("❌ PLAN FAILED");
      return;
    }

    setPlan(data);
    setStatus("🧠 PLAN_READY — SANDBOXING...");

    // 2️⃣ SANDBOX (derive files directly from plan response)
    const filesForSandbox = (data.files || []).filter(
      (f) => f.mode === "FULL_CONTENT" && typeof f.content === "string"
    );

    const sb = await fetch("/api/siva-sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: data.taskId,
        files: filesForSandbox,
      }),
    });

    const sbData = await sb.json();

    const allowApply = sbData.verdict !== "FAILED";

    setSandbox({
      ...sbData,
      allowApply,
    });

    setStatus(
      allowApply
        ? "🟢 SANDBOX PASSED — APPLY READY"
        : "🔴 SANDBOX FAILED — APPLY BLOCKED"
    );
  }

  // ─────────────────────────────
  // APPLY
  // ─────────────────────────────
  async function approveAndApply() {
    if (!sandbox?.allowApply || !plan) {
      setStatus("⛔ APPLY BLOCKED BY SANDBOX");
      return;
    }

    setStatus("SIVA_APPLYING...");

    // 🔑 RE-DERIVE FILES AT APPLY TIME (critical fix)
    const filesForApply = (plan.files || []).filter(
      (f) => f.mode === "FULL_CONTENT" && typeof f.content === "string"
    );

    const res = await fetch("/api/siva-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: plan.taskId,
        files: filesForApply,
      }),
    });

    if (!res.ok) {
      setStatus("❌ APPLY FAILED");
      return;
    }

    setStatus("✅ SIVA_COMMITTED");
    setCommand("");
    setPlan(null);
    setSandbox(null);
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
        padding: 20,
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #0f0",
        }}
      >
        <h2>CIPHER_TERMINAL_V2 — SIVA</h2>
        <Link
          href="/"
          style={{
            color: "#0f0",
            border: "1px solid #0f0",
            padding: "4px 10px",
          }}
        >
          RETURN_TO_CHAT
        </Link>
      </div>

      <p style={{ background: "#111", padding: 8, marginTop: 15 }}>
        STATUS: {status}
      </p>

      <textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Siva IMPLEMENT a settings page with autonomy toggle"
        style={{
          width: "100%",
          height: 120,
          background: "#111",
          color: "#0f0",
          border: "1px solid #0f0",
          padding: 12,
        }}
      />

      <button
        onClick={runSivaPlan}
        style={{
          width: "100%",
          marginTop: 10,
          padding: 15,
          background: "#0f0",
          color: "#000",
          fontWeight: "bold",
        }}
      >
        RUN SIVA PLAN
      </button>

      {sandbox && (
        <div
          style={{
            marginTop: 20,
            border: "1px solid #0f0",
            padding: 15,
          }}
        >
          <h3>SANDBOX VERDICT: {sandbox.verdict}</h3>
          <p>
            Confidence:{" "}
            {typeof sandbox.confidence === "number"
              ? `${sandbox.confidence}%`
              : "—"}
          </p>

          {sandbox.issues?.length > 0 && (
            <ul>
              {sandbox.issues.map((i, idx) => (
                <li key={idx}>
                  [{i.type}] {i.file}: {i.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sandbox?.allowApply && (
        <button
          onClick={approveAndApply}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 15,
            background: "#00ff99",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          APPROVE & APPLY
        </button>
      )}
    </div>
  );
}
