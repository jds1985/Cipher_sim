// test.js — Corrected Version (Prevents Duplicate Output)

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("run-autonomy");
  const output = document.getElementById("autonomy-output");
  const runIdEl = document.getElementById("run-id");
  const versionEl = document.getElementById("version");

  runBtn.addEventListener("click", async () => {
    try {
      runBtn.disabled = true;
      runBtn.innerText = "Running...";

      // ⭐ FIX: Clear previous render BEFORE injecting new output
      output.innerHTML = "";
      runIdEl.textContent = "";
      versionEl.textContent = "";

      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });

      const data = await res.json();

      // Add run ID + version
      runIdEl.textContent = data.run_id || "unknown";
      versionEl.textContent = data.version || "unknown";

      // Render the model’s Markdown response cleanly
      output.innerHTML = marked.parse(data.output || "No output received.");

    } catch (err) {
      console.error("Autonomy Error:", err);
      output.innerHTML = `<p style="color:red;">Error running autonomy test.</p>`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerText = "🚀 Run Cipher Autonomy";
    }
  });
});
