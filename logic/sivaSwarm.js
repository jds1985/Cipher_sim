import { SIVA_TASK_SCHEMAS } from "./sivaSchemas";

export function planBuildTask(task) {
  if (!task || !task.type) {
    throw new Error("TASK_TYPE_REQUIRED");
  }

  if (!SIVA_TASK_SCHEMAS[task.type]) {
    throw new Error("TASK_TYPE_NOT_ALLOWED");
  }

  return {
    mode: "PLANNER_ONLY",
    taskType: task.type,
    summary: task.summary,
    output: task.plan,
    nextStep: "REVIEW_AND_APPROVE"
  };
}
