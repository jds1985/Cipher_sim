"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function TerminalUI() {
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState(null);
  const [sandbox, setSandbox] = useState(null);
  const [thoughts, setThoughts] = useState([]);
  const [status, setStatus] = useState("SYSTEM_READY");

  // ─────────────────────────────
  // APPLY-ELIGIBLE FILES
  // ─────────────────────────────
  const applyEligibleFiles = useMemo(() => {
    if (!plan?.capabilities?.canApply) return [];

    return (plan.files || []).filter((f) => {
      if (f.mode === "FULL_CONTENT" && typeof f.content === "string") {
        return true;
      }

      if (
        f.mode === "PATCH" &&
        typeof f.syntheticContent === "string" &&
        Array.isArray(f.patchOps)
      ) {
        return true;
      }

      return false;
    });
  }, [plan]);

  // ─────────────────────────────
  // RUN PLAN (+ THINK SUPPORT)
  // ─────────────────────────────
  async function runSivaPlan() {
    if (!command.trim()) return;

    setStatus("SIVA_PLANNING...");
    setPlan(null);
    setSandbox(null);
    setThoughts([]);

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
    setThoughts(data.thoughts || []);

    // 🧠 THINK-ONLY MODE — NO SANDBOX, NO APPLY
    if (data.capabilities?.canThink && !data.capabilities?.canApply) {
      setStatus("🧠 THINK MODE — NO FILE CHANGES");
      return;
    }

    setStatus("🧠 PLAN_READY — SANDBOXING...");

    // Sandbox only writable types
    const filesForSandbox = (data.files || []).filter(
      (f) =>
        (f.mode === "FULL_CONTENT" && typeof f.content === "string") ||
        (f.mode === "PATCH" && typeof f.syntheticContent === "string")
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

    const writableFiles = filesForSandbox.length;

    const allowApply =
      sbData.verdict !== "FAILED" && writableFiles > 0;

    setSandbox({ ...sbData, allowApply });

    setStatus(
      allowApply
        ? "🟢 SANDBOX PASSED — APPLY READY"
        : "🟡 SANDBOX COMPLETE — NO WRITABLE FILES"
    );
  }

  // ─────────────────────────────
  // APPLY
  // ─────────────────────────────
  async function approveAndApply() {
    if (!sandbox?.allowApply || !plan) {
      setStatus("⛔ APPLY BLOCKED");
      return;
    }

    const filesForApply = applyEligibleFiles.map((f) => ({
      ...f,
      action: "CREATE_OR_UPDATE",
    }));

    if (filesForApply.length === 0) {
      setStatus("⛔ NO WRITABLE FILES");
      return;
    }

    setStatus("SIVA_APPLYING...");

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
    setThoughts([]);
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
        placeholder='Cipher THINK about restoring chat and voice'
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

      {/* THINK OUTPUT */}
      {thoughts.length > 0 && (
        <div
          style={{
            marginTop: 20,
            border: "1px solid #0f0",
            padding: 15,
            background: "#010",
          }}
        >
          <h3>CIPHER THINKING</h3>
          {thoughts.map((t, i) => (
            <p key={i} style={{ margin: "6px 0" }}>
              ▸ {t}
            </p>
          ))}
        </div>
      )}

      {/* SANDBOX */}
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
        </div>
      )}

      {/* APPLY */}
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
