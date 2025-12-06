// test.js — FINAL V8 TEST SUITE (Test 4 active)

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("run-autonomy");
  const output = document.getElementById("autonomy-output");
  const runIdEl = document.getElementById("run-id");
  const versionEl = document.getElementById("version");

  runBtn.addEventListener("click", async () => {
    try {
      runBtn.disabled = true;
      runBtn.innerText = "Running...";

      // FULL RESET — prevents duplication
      output.innerHTML = "";
      runIdEl.textContent = "";
      versionEl.textContent = "";

      // -------------------------
      // 🔥 ACTIVE TEST: TEST 4
      // -------------------------
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

      // SEND TO API
      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: testPayload })
      });

      const data = await res.json();
      const { autonomyRunId, version, reflection } = data;

      // Place metadata
      runIdEl.textContent = autonomyRunId || "unknown";
      versionEl.textContent = version || "unknown";

      // CLEAN MODEL OUTPUT
      let cleanedOutput = reflection
        .replace(/Autonomy Run ID:.*/gi, "")
        .replace(/Version:.*/gi, "")
        .replace(/Autonomy Output:/gi, "")
        .trim();

      // Render Markdown
      output.innerHTML = marked.parse(cleanedOutput || "No output received.");

      // Fix mobile rendering bug
      output.style.minHeight = output.scrollHeight + "px";

    } catch (err) {
      console.error("Autonomy Test Error:", err);
      output.innerHTML = `<p style="color:red;">Error running autonomy test.</p>`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerText = "🚀 Run Cipher Autonomy";
    }
  });
});
