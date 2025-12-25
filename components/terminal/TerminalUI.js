async function runSivaPlan() {
  if (!command.trim()) return;

  setStatus("SIVA_PLANNING...");
  setPlan(null);

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

    if (!res.ok || data.status !== "SIVA_PLAN_OK") {
      console.error("SIVA PLAN ERROR:", data);
      setStatus("❌ PLAN FAILED");
      return;
    }

    // 🔑 THIS IS THE IMPORTANT FIX
    setPlan({
      taskId: data.taskId,
      files: data.plan.files,
      raw: data.plan,
    });

    setStatus("🧠 PLAN_READY");
  } catch (err) {
    console.error(err);
    setStatus("❌ CONNECTION_ERROR");
  }
}
