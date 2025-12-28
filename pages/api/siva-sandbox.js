// pages/api/siva-sandbox.js
// SIVA — SANDBOX PHASE v1.1
// Semantic awareness · Dry-run · No commits

const BLOCKED_PATH_PREFIXES = [
  ".git/",
  "node_modules/",
  ".next/",
  "out/",
  "dist/",
  "build/",
];

const BLOCKED_PATH_EXACT = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
]);

function normalizePath(p) {
  return p.replace(/\\/g, "/").trim();
}

function isBlockedPath(path) {
  if (BLOCKED_PATH_EXACT.has(path)) return true;
  return BLOCKED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/* ───────── Syntax Checks ───────── */

function hasSyntaxRedFlags(content) {
  const flags = [];
  if (content.includes("require(")) {
    flags.push("CommonJS require() detected — prefer ES imports");
  }
  if (content.includes("eval(")) {
    flags.push("eval() detected — blocked in sandbox");
  }
  return flags;
}

function checkImports(content, filePath) {
  const issues = [];
  const importRegex =
    /import\s+.*?\s+from\s+['"](.+?)['"]/g;

  let match;
  while ((match = importRegex.exec(content))) {
    const target = match[1];
    if (target.startsWith(".") && !target.match(/\.(js|jsx)$/)) {
      issues.push({
        type: "IMPORT_WARNING",
        file: filePath,
        message: `Relative import "${target}" has no extension`,
      });
    }
  }
  return issues;
}

/* ───────── Semantic Checks (NEW) ───────── */

function semanticScan(file) {
  const issues = [];
  const { path, content } = file;

  // API surface changes
  if (path.startsWith("pages/api/")) {
    issues.push({
      type: "SEMANTIC_WARNING",
      file: path,
      message: "Modifies or introduces API endpoint",
    });
  }

  // Public routes
  if (path.startsWith("pages/") && !path.startsWith("pages/api/")) {
    issues.push({
      type: "SEMANTIC_INFO",
      file: path,
      message: "Creates or modifies public route",
    });
  }

  if (typeof content === "string") {
    const lower = content.toLowerCase();

    if (lower.includes("process.env")) {
      issues.push({
        type: "SEMANTIC_WARNING",
        file: path,
        message: "Accesses environment variables",
      });
    }

    if (
      lower.includes("auth") ||
      lower.includes("token") ||
      lower.includes("session")
    ) {
      issues.push({
        type: "SEMANTIC_WARNING",
        file: path,
        message: "Touches authentication boundary",
      });
    }

    if (
      lower.includes("firebase") ||
      lower.includes("firestore") ||
      lower.includes("database") ||
      lower.includes("db.")
    ) {
      issues.push({
        type: "SEMANTIC_WARNING",
        file: path,
        message: "Touches persistence layer",
      });
    }

    if (content.includes("fetch(")) {
      issues.push({
        type: "SEMANTIC_INFO",
        file: path,
        message: "Performs external or internal fetch",
      });
    }
  }

  return issues;
}

/* ───────── Handler ───────── */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "METHOD_NOT_ALLOWED" });
  }

  const { taskId, files } = req.body || {};

  if (!taskId || !Array.isArray(files)) {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error: "Missing taskId or files[]",
    });
  }

  const issues = [];
  let verdict = "CLEAN";

  for (const file of files) {
    const rawPath = file?.path;
    const content = file?.content;

    if (!rawPath) continue;

    const path = normalizePath(rawPath);

    // 🔒 Path safety
    if (isBlockedPath(path)) {
      issues.push({
        type: "BLOCKED_PATH",
        file: path,
        message: "Target path is blocked in sandbox",
      });
      verdict = "FAILED";
      continue;
    }

    // 🧠 Syntax checks
    if (typeof content === "string") {
      hasSyntaxRedFlags(content).forEach((msg) => {
        verdict = verdict === "FAILED" ? "FAILED" : "WARNINGS";
        issues.push({
          type: "SYNTAX_WARNING",
          file: path,
          message: msg,
        });
      });

      issues.push(...checkImports(content, path));
    } else {
      verdict = verdict === "FAILED" ? "FAILED" : "WARNINGS";
      issues.push({
        type: "NO_CONTENT",
        file: path,
        message: "No content provided (design-only or placeholder)",
      });
    }

    // 🧠 Semantic scan (NEW)
    semanticScan({ path, content }).forEach((i) => {
      if (i.type.includes("WARNING") && verdict !== "FAILED") {
        verdict = "WARNINGS";
      }
      issues.push(i);
    });
  }

  return res.status(200).json({
    status: "SIVA_SANDBOX_OK",
    taskId,
    verdict,
    issues,
    summary:
      verdict === "CLEAN"
        ? "Sandbox passed with no issues"
        : verdict === "WARNINGS"
        ? "Sandbox completed with semantic warnings"
        : "Sandbox failed — apply blocked",
  });
}
