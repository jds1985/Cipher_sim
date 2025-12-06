// test.js — FINAL FIXED VERSION (Removes metadata & prevents double render)

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("run-autonomy");
  const output = document.getElementById("autonomy-output");
  const runIdEl = document.getElementById("run-id");
  const versionEl = document.getElementById("version");

  runBtn.addEventListener("click", async () => {
    try {
      runBtn.disabled = true;
      runBtn.innerText = "Running...";

      // FULL RESET — prevents duplication on mobile
      output.innerHTML = "";
      runIdEl.textContent = "";
      versionEl.textContent = "";

      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true })
      });

      const data = await res.json();

      const { run_id, version, output: rawOutput } = data;

      // ⭐ Place metadata in their correct UI spots
      runIdEl.textContent = run_id || "unknown";
      versionEl.textContent = version || "unknown";

      // ⭐ Stronger metadata filtering — removes ALL echoed metadata
      let cleanedOutput = (rawOutput || "")
        .replace(/🔥 Autonomy Run ID:.*/gi, "")
        .replace(/🧬 Version:.*/gi, "")
        .replace(/Autonomy Run ID:.*/gi, "")
        .replace(/Version:.*/gi, "")
        .replace(/Autonomy Output:.*/gi, "")
        .replace(/Output:.*/gi, "")
        .trim();

      // ⭐ Safely render Markdown
      output.innerHTML = marked.parse(cleanedOutput || "No output received.");

      // ⭐ Force layout recompute (fixes mobile render bugs)
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
