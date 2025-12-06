document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("run-autonomy");
  const output = document.getElementById("autonomy-output");
  const runIdEl = document.getElementById("run-id");
  const versionEl = document.getElementById("version");

  runBtn.addEventListener("click", async () => {
    try {
      runBtn.disabled = true;
      runBtn.innerText = "Running...";

      output.innerHTML = "";
      runIdEl.textContent = "";
      versionEl.textContent = "";

      // --- TEST 5 PAYLOAD WILL BE INSERTED BY JIM ---
      const note = document.getElementById("autonomy-input")?.value || "";

      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note })
      });

      const data = await res.json();

      // 🔥 NEW: ERROR HANDLING
      if (data.error) {
        output.innerHTML = `<p style="color:red;">API Error: ${data.error}</p>`;
        console.error("API Error:", data);
        return;
      }

      const { autonomyRunId, version, reflection } = data;

      runIdEl.textContent = autonomyRunId || "unknown";
      versionEl.textContent = version || "unknown";

      let cleanedOutput = reflection
        .replace(/Autonomy Run ID:.*/gi, "")
        .replace(/Version:.*/gi, "")
        .replace(/Autonomy Output:/gi, "")
        .trim();

      output.innerHTML = marked.parse(cleanedOutput || "No output received.");
      output.style.minHeight = output.scrollHeight + "px";

    } catch (err) {
      console.error("Autonomy Test Error:", err);
      output.innerHTML = `<p style="color:red;">Frontend Error: ${err.message}</p>`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerText = "🚀 Run Cipher Autonomy";
    }
  });
});
