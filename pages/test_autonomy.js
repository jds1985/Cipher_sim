// test.js — Autonomy v8 Compatible + Mobile Safe + Metadata Cleaned

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("run-autonomy");
  const output = document.getElementById("autonomy-output");
  const runIdEl = document.getElementById("run-id");
  const versionEl = document.getElementById("version");

  runBtn.addEventListener("click", async () => {
    try {
      // Disable button + show progress
      runBtn.disabled = true;
      runBtn.innerText = "Running...";

      // 🔥 HARD RESET – prevents duplication / ghost outputs
      output.innerHTML = "";
      runIdEl.textContent = "";
      versionEl.textContent = "";

      // POST to API (no note required for tests)
      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Test Autonomy Run" })
      });

      const data = await res.json();

      // Pull values the API returns
      const { autonomyRunId, version, reflection } = data;

      // Put metadata in the correct UI spots
      runIdEl.textContent = autonomyRunId || "unknown";
      versionEl.textContent = version || "unknown";

      // ------- CLEAN THE MODEL OUTPUT -------
      let cleaned = reflection
        .replace(/Autonomy Run ID:.*/gi, "")
        .replace(/🧬 Version:.*/gi, "")
        .replace(/Version:.*/gi, "")
        .replace(/Autonomy Output:/gi, "")
        .trim();

      if (!cleaned || cleaned.length < 3) {
        cleaned = "No usable output received.";
      }

      // Convert Markdown to HTML
      output.innerHTML = marked.parse(cleaned);

      // Fix mobile sizing glitch
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
