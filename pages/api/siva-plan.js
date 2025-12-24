import { planBuildTask } from "../../logic/sivaSwarm";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { task } = req.body;
    const result = planBuildTask(task);

    res.status(200).json({
      status: "SIVA_PLAN_READY",
      result
    });
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
}
