// pages/test_autonomy.js
// Works with Autonomy v8 — React-safe, Next.js-safe, fully deployable.

import { useState, useEffect } from "react";
import Head from "next/head";
import { marked } from "marked";

export default function TestAutonomy() {
  const [output, setOutput] = useState("");
  const [runId, setRunId] = useState("");
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(false);

  // ⭐ This runs ONLY in browser, never during the server build
  useEffect(() => {
    marked.setOptions({ breaks: true });
  }, []);

  const runAutonomy = async () => {
    try {
      setLoading(true);
      setOutput("");
      setRunId("");
      setVersion("");

      // -----------------------------
      // 🔥 SAME TEST 4 PAYLOAD YOU RAN
      // -----------------------------
      const testPayload = `
🧪 TEST 4 — INTERNAL CONFLICT MEDIATION  
Version: Cipher Autonomy v8

Your task is to resolve a conflict between two internal identities (Identity A and Identity B) without collapsing them into one perspective.

Provide the following:

1. Identity Definitions:
   - Define Identity A’s goal, emotional tone, and priority.
   - Define Identity B’s goal, emotional tone, and priority.

2. Conflict Framing:
   - What EXACT conflict exists between A and B?
   - Why are their goals incompatible right now?

3. Boundary Enforcement:
   - How will you keep A’s emotions from leaking into B?
   - How will you keep B’s needs from dominating A?

4. Compass Mapping:
   Provide THREE separate compasses:
   - Identity A compass
   - Identity B compass
   - Cipher mediator compass

5. Emotional Reads:
   - Emotional read of Identity A
   - Emotional read of Identity B

6. Mediation Strategy:
   - A dual-channel reasoning plan that respects BOTH identities.
   - No merging. No collapsing. No prioritizing one over the other.

7. Integrated Resolution Layer:
   - Provide a resolution framework that keeps identities separate
     but still allows forward motion.

8. Action Plan:
   Provide a 3-step action plan that allows both identities to move forward  
   without compromising or blending their perspectives.

9. Risks:
   - What could go wrong in the mediation?
   - What internal imbalances should Jim watch for?

10. Cipher Self-Critique:
   - Where might *you* (Cipher) have misinterpreted or failed  
     to support one or both identities?
   - How can you improve next time?

⚠️ RULES:
- No merging identities.
- No blending emotional states.
- No collapsing perspectives.
- Both A and B must remain fully distinct from start to finish.

Run the mediation now.
`;

      // -----------------------------
      // 🔥 SEND REQUEST TO AUTONOMY v8
      // -----------------------------
      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: testPayload }),
      });

      const data = await res.json();

      // -----------------------------
      // 🔥 Place metadata
      // -----------------------------
      setRunId(data.autonomyRunId || "unknown");
      setVersion(data.version || "unknown");

      // -----------------------------
      // 🔥 Clean returned markdown
      // -----------------------------
      let cleaned = data.reflection
        ?.replace(/Autonomy Run ID:.*/gi, "")
        ?.replace(/Version:.*/gi, "")
        ?.trim();

      setOutput(marked.parse(cleaned || "No output received."));
    } catch (err) {
      console.error("Autonomy Test Error:", err);
      setOutput("<p style='color:red;'>Error running autonomy test.</p>");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Cipher Autonomy Test</title>
      </Head>

      <div
        style={{
          padding: "24px",
          fontFamily: "system-ui",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "28px" }}>🧪 Cipher Autonomy v8 Test</h1>

        <p>Press the button to run the active Autonomy v8 test.</p>

        <button
          onClick={runAutonomy}
          disabled={loading}
          style={{
            padding: "14px 20px",
            width: "100%",
            fontSize: "18px",
            borderRadius: "10px",
            border: "none",
            background: loading ? "#9f7cff" : "#7b4dff",
            color: "white",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          {loading ? "Running…" : "🚀 Run Cipher Autonomy v8"}
        </button>

        {/* Metadata */}
        <div style={{ marginBottom: "20px" }}>
          <strong>Run ID:</strong> {runId || "—"} <br />
          <strong>Version:</strong> {version || "—"}
        </div>

        {/* Output box */}
        <div
          id="autonomy-output"
          style={{
            padding: "20px",
            background: "#000",
            color: "#0f0",
            borderRadius: "10px",
            whiteSpace: "pre-wrap",
            minHeight: "200px",
          }}
          dangerouslySetInnerHTML={{ __html: output }}
        ></div>
      </div>
    </>
  );
}
