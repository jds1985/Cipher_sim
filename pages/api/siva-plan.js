export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { instruction } = req.body || {};

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    taskId: "TEST_" + Date.now(),
    files: [],
    capabilities: {
      canApply: false,
    },
  });
}
