// pages/api/siva-plan.js
// SIVA — Planning Endpoint (SAFE / READ-ONLY)

export default async function handler(req, res) {
  // Explicitly declare Siva mode
  const SIVA_MODE = "PLANNER_ONLY";

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "METHOD_NOT_ALLOWED",
        allowed: ["POST"]
      });
    }

    const { task } = req.body;

    if (!task || typeof task !== "object") {
      return res.status(400).json({
        error: "INVALID_TASK",
        message: "Task object is required"
      });
    }

    // Normalize task structure
    const normalizedTask = {
      type: task.type || "UNKNOWN",
      summary: task.summary || "No summary provided",
      plan: task.plan || {},
      receivedAt: new Date().toISOString()
    };

    // Return planner-only response
    return res.status(200).json({
      status: "SIVA_PLAN_READY",
      mode: SIVA_MODE,
      capabilities: {
        canPlan: true,
        canGenerate: false,
        canApply: false,
        canWriteFiles: false,
        canCommit: false,
        canRedeploy: false
      },
      plan: normalizedTask,
      nextStep: "REVIEW_AND_APPROVE"
    });

  } catch (err) {
    console.error("SIVA_PLAN_ERROR:", err);

    return res.status(500).json({
      error: "SIVA_PLAN_FAILURE",
      message: err.message || "Unknown planner error"
    });
  }
}
