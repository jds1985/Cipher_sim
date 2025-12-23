export const ALLOWED_PATHS = [
  "components/",
  "logic/",
  "styles/",
  "utils/"
];

export function validateTargetPath(path) {
  return ALLOWED_PATHS.some((allowed) => path.startsWith(allowed));
}

export function planBuildTask(instruction) {
  return {
    intent: instruction,
    files: [],
    notes: "SivaSwarm planning phase only"
  };
}

export function generateFileEdit({ path, content }) {
  if (!validateTargetPath(path)) {
    throw new Error("SIVA_BLOCKED_PATH");
  }

  return {
    path,
    content,
    action: "WRITE"
  };
}
