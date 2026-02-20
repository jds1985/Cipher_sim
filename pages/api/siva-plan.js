// pages/api/siva-plan.js
// SIVA — PLAN PHASE (THINK + FIX + PATCH + APPLY + SCAN)
// Intent Router · Cognitive Planner · Safe Executor
// Dark. Calm. In control.

import { runOrchestrator } from "../../cipher_os/runtime/orchestrator.js";
import { getDb } from "../../firebaseAdmin.js";

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
  SIVA_ADMIN_KEY,
} = process.env;

function isAuthorized(req) {
  const k = req.headers["x-siva-admin"];
  return Boolean(SIVA_ADMIN_KEY && k && k === SIVA_ADMIN_KEY);
}

function deny(res) {
  return res.status(403).json({ status: "SIVA_UNAUTHORIZED" });
}

// Safety: block dangerous targets (same spirit as siva-apply)
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
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

function isAllowedPath(p) {
  if (!p || typeof p !== "string") return { ok: false, reason: "Missing path" };
  const path = p.replace(/\\/g, "/").trim();

  if (path.startsWith("/") || path.includes("..")) {
    return { ok: false, reason: "Path traversal or absolute path not allowed" };
  }
  if (!/^[a-zA-Z0-9._\-\/]+$/.test(path)) {
    return { ok: false, reason: "Invalid characters in path" };
  }
  if (BLOCKED_PATH_EXACT.has(path)) {
    return { ok: false, reason: `Blocked file: ${path}` };
  }
  for (const pre of BLOCKED_PATH_PREFIXES) {
    if (path.startsWith(pre)) return { ok: false, reason: `Blocked directory: ${pre}` };
  }
  return { ok: true, normalized: path };
}

async function ghFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { ok: res.ok, status: res.status, data, raw: text };
}

async function ghReadFile(path) {
  const check = isAllowedPath(path);
  if (!check.ok) throw new Error(check.reason);

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    check.normalized
  )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await ghFetch(url, { method: "GET" });

  if (res.status === 404) return { exists: false, path: check.normalized, sha: null, content: null };

  if (!res.ok || !res.data?.sha) {
    throw new Error(`GitHub read failed (${res.status}): ${res.data?.message || res.raw}`);
  }

  const content = res.data.content
    ? Buffer.from(res.data.content, "base64").toString("utf8")
    : "";

  return { exists: true, path: check.normalized, sha: res.data.sha, content };
}

async function ghRepoTreeRecursive() {
  // 1) resolve branch -> commit sha
  const refUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${encodeURIComponent(
    GITHUB_BRANCH
  )}`;
  const ref = await ghFetch(refUrl, { method: "GET" });
  if (!ref.ok) throw new Error(`GitHub ref failed (${ref.status}): ${ref.data?.message || ref.raw}`);

  const commitSha = ref.data?.object?.sha;
  if (!commitSha) throw new Error("Could not resolve branch SHA");

  // 2) commit -> tree sha
  const commitUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${encodeURIComponent(
    commitSha
  )}`;
  const commit = await ghFetch(commitUrl, { method: "GET" });
  if (!commit.ok) throw new Error(`GitHub commit failed (${commit.status}): ${commit.data?.message || commit.raw}`);

  const treeSha = commit.data?.tree?.sha;
  if (!treeSha) throw new Error("Could not resolve tree SHA");

  // 3) tree recursive
  const treeUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${encodeURIComponent(
    treeSha
  )}?recursive=1`;
  const tree = await ghFetch(treeUrl, { method: "GET" });
  if (!tree.ok) throw new Error(`GitHub tree failed (${tree.status}): ${tree.data?.message || tree.raw}`);

  const items = Array.isArray(tree.data?.tree) ? tree.data.tree : [];
  return items;
}

function classifySivaIntent(text = "") {
  const t = String(text).toLowerCase();

  if (t.includes("scan") || t.includes("map") || t.includes("index") || t.includes("inventory")) return "scan";
  if (t.includes("think") || t.includes("analyze") || t.includes("reason")) return "think";
  if (t.includes("patch")) return "patch";
  if (t.includes("fix") || t.includes("repair") || t.includes("debug")) return "fix";
  if (t.includes("implement") || t.includes("apply") || t.includes("commit") || t.includes("create")) return "apply";

  return "none";
}

function extractPath(raw) {
  const m = String(raw).match(/([A-Za-z0-9._\-\/]+\.js)/);
  return m ? m[1] : null;
}

function summarizeRoleByPath(p) {
  const path = String(p);
  if (path.startsWith("pages/api/")) return "api_route";
  if (path.startsWith("cipher_os/runtime/")) return "runtime_core";
  if (path.startsWith("cipher_os/models/")) return "model_adapter";
  if (path.startsWith("cipher_core/")) return "cipher_core";
  if (path.startsWith("components/")) return "ui_component";
  if (path.includes("firebase")) return "firebase";
  if (path.includes("telemetry")) return "telemetry";
  if (path.includes("orchestrator")) return "orchestrator";
  return "misc";
}

export default async function handler(req, res) {
  // Gate 1: admin header (required for ALL SIVA)
  if (!isAuthorized(req)) return deny(res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return res.status(500).json({
      status: "ENV_MISSING",
      error: "GitHub environment variables not configured",
    });
  }

  const { instruction, source = "terminal" } = req.body || {};

  if (!instruction || typeof instruction !== "string") {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error: "Missing instruction string",
    });
  }

  const taskId = "SIVA_" + Date.now();
  const intentRaw = instruction.trim();
  const kind = classifySivaIntent(intentRaw);

  // ─────────────────────────────────────────────
  // 🧠 THINK MODE (no files)
  // ─────────────────────────────────────────────
  if (kind === "think") {
    return res.status(200).json({
      status: "SIVA_THINK_OK",
      phase: "THINK",
      taskId,
      time: new Date().toISOString(),
      source,
      intent: intentRaw,
      summary: "Cognitive analysis requested",
      thoughts: [
        "Think mode is advisory only.",
        "Use SCAN to build repo awareness memory.",
        "Use FIX to generate deterministic patchOps for siva-apply.",
      ],
      files: [],
      safeguards: { planOnly: true, requiresHumanApproval: false, selfModification: false },
      capabilities: { canThink: true, canScan: true, canFix: true, canPatch: true, canApply: true },
      nextStep: "Use SCAN, FIX, PATCH, or APPLY",
    });
  }

  // ─────────────────────────────────────────────
  // 🗺️ SCAN MODE (repo awareness + Firestore index)
  // ─────────────────────────────────────────────
  if (kind === "scan") {
    const tree = await ghRepoTreeRecursive();

    // keep only "blob" files, filter blocked dirs
    const files = tree
      .filter((x) => x?.type === "blob" && typeof x?.path === "string")
      .map((x) => x.path.replace(/\\/g, "/"))
      .filter((p) => {
        if (BLOCKED_PATH_EXACT.has(p)) return false;
        for (const pre of BLOCKED_PATH_PREFIXES) if (p.startsWith(pre)) return false;
        return true;
      });

    // lightweight index
    const index = files.map((p) => ({
      path: p,
      role: summarizeRoleByPath(p),
      ext: (p.split(".").pop() || "").toLowerCase(),
    }));

    const db = getDb();
    const saved = { ok: false, reason: "Firestore unavailable" };

    if (db) {
      const payload = {
        taskId,
        branch: GITHUB_BRANCH,
        repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        indexedAt: Date.now(),
        count: index.length,
        index, // if too big, we can shard later. Start here.
      };

      // store history + "latest"
      await db.collection("cipher_repo_index").doc(taskId).set(payload);
      await db.collection("cipher_repo_index").doc("latest").set(payload);

      saved.ok = true;
      saved.reason = null;
    }

    return res.status(200).json({
      status: "SIVA_SCAN_OK",
      phase: "SCAN",
      taskId,
      time: new Date().toISOString(),
      source,
      intent: intentRaw,
      summary: `Repo scan complete: ${index.length} files indexed`,
      saved,
      safeguards: { planOnly: true, requiresHumanApproval: false, selfModification: false },
      nextStep: "Ask FIX <path> ... to generate deterministic patchOps",
    });
  }

  // ─────────────────────────────────────────────
  // 🔎 PATH EXTRACTION (for FIX/PATCH/APPLY)
  // ─────────────────────────────────────────────
  const targetPath = extractPath(intentRaw);

  // ─────────────────────────────────────────────
  // 🛠️ FIX MODE (read file -> LLM returns JSON patchOps)
  // ─────────────────────────────────────────────
  if (kind === "fix") {
    if (!targetPath) {
      return res.status(200).json({
        status: "SIVA_PLAN_REJECTED",
        phase: "PLAN",
        taskId,
        summary: "FIX rejected: missing a target .js path in the instruction",
        files: [],
        safeguards: { planOnly: true, requiresHumanApproval: true, selfModification: false },
        nextStep: "Example: Siva FIX pages/api/chat.js to handle empty input safely",
      });
    }

    const file = await ghReadFile(targetPath);
    if (!file.exists || typeof file.content !== "string") {
      return res.status(200).json({
        status: "SIVA_PLAN_REJECTED",
        phase: "PLAN",
        taskId,
        summary: `FIX rejected: file not found in repo (${file.path})`,
        files: [],
        safeguards: { planOnly: true, requiresHumanApproval: true, selfModification: false },
      });
    }

    // Ask orchestrator for deterministic JSON patchOps only
    const executivePacket = {
      systemPrompt: `
You are SIVA PATCH PLANNER.
Return ONLY valid JSON. No markdown. No commentary.

Your task: generate deterministic patchOps[] compatible with this patch engine:
Supported ops: INSERT_AFTER, INSERT_BEFORE, REPLACE, APPEND, PREPEND.
Each op uses:
- op: string
- match: string (required for INSERT/REPLACE)
- insert: string (for INSERT/APPEND/PREPEND)
- replace: string (for REPLACE)
- once: boolean (optional)

Rules:
- Prefer smallest safe change.
- If you cannot safely patch deterministically, return:
{"patchOps":[{"op":"FAIL_SAFE","reason":"<why>"}]}

Return shape:
{"patchOps":[ ... ]}

Now patch this file content based on the user instruction.
`,
    };

    const osContext = {
      input: { userMessage: `INSTRUCTION:\n${intentRaw}\n\nFILE_PATH:\n${file.path}\n\nFILE_CONTENT:\n${file.content}` },
      memory: { uiHistory: [] },
    };

    const out = await runOrchestrator({
      osContext,
      executivePacket,
      stream: false,
      structured: true, // <- we will add this to orchestrator below
    });

    const patchOps = out?.data?.patchOps;

    if (!Array.isArray(patchOps) || patchOps.length === 0) {
      return res.status(200).json({
        status: "SIVA_PLAN_REJECTED",
        phase: "PLAN",
        taskId,
        summary: "FIX rejected: model did not return valid patchOps JSON",
        files: [],
        safeguards: { planOnly: true, requiresHumanApproval: true, selfModification: false },
      });
    }

    return res.status(200).json({
      status: "SIVA_PLAN_OK",
      phase: "PLAN",
      taskId,
      time: new Date().toISOString(),
      source,
      intent: intentRaw,
      summary: `Generated PATCH plan for ${file.path}`,
      files: [
        {
          path: file.path,
          action: "CREATE_OR_UPDATE",
          mode: "PATCH",
          mutation: "PATCH_EXISTING",
          patchOps,
        },
      ],
      safeguards: { planOnly: false, requiresHumanApproval: true, selfModification: false },
      capabilities: { canThink: true, canScan: true, canFix: true, canPatch: true, canApply: true },
      nextStep: "Run DRY RUN via siva-apply (dryRun=true), then commit",
    });
  }

  // ─────────────────────────────────────────────
  // 🧩 PATCH MODE (your existing guarded demo logic, but admin-gated now)
  // ─────────────────────────────────────────────
  if (kind === "patch") {
    // Keep your earlier behavior: require a quoted string
    const quoted = intentRaw.match(/"([^"]+)"/);
    if (!targetPath || !quoted) {
      return res.status(200).json({
        status: "SIVA_PLAN_REJECTED",
        phase: "PLAN",
        taskId,
        summary: "Patch rejected: missing <path.js> and quoted string",
        files: [],
        safeguards: { planOnly: true, requiresHumanApproval: true, selfModification: false },
        nextStep: 'Use: Siva PATCH <path.js> add a line saying "..."',
      });
    }

    return res.status(200).json({
      status: "SIVA_PLAN_OK",
      phase: "PLAN",
      taskId,
      time: new Date().toISOString(),
      source,
      intent: intentRaw,
      summary: `Patch ${targetPath}: add line "${quoted[1]}"`,
      files: [
        {
          path: targetPath,
          action: "CREATE_OR_UPDATE",
          mode: "PATCH",
          mutation: "PATCH_EXISTING",
          patchOps: [
            {
              op: "INSERT_AFTER",
              match: `{children || "Component active."}`,
              insert: `\n          "${quoted[1]}"`,
              once: true,
            },
          ],
        },
      ],
      safeguards: { planOnly: false, requiresHumanApproval: true, selfModification: false },
      nextStep: "DRY RUN then APPLY",
    });
  }

  // ─────────────────────────────────────────────
  // 🧱 APPLY MODE (we keep simple: you already have apply engine)
  // ─────────────────────────────────────────────
  if (kind === "apply") {
    return res.status(200).json({
      status: "SIVA_PLAN_OK",
      phase: "PLAN",
      taskId,
      time: new Date().toISOString(),
      source,
      intent: intentRaw,
      summary: "APPLY requested. Provide files[] to /api/siva-apply.",
      files: [],
      safeguards: { planOnly: true, requiresHumanApproval: true, selfModification: false },
      nextStep: "Send files[] to /api/siva-apply (dryRun=true first)",
    });
  }

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    phase: "PLAN",
    taskId,
    time: new Date().toISOString(),
    source,
    intent: intentRaw,
    summary: "No actionable intent detected. Use SCAN, FIX, PATCH, or APPLY.",
    files: [],
    safeguards: { planOnly: true, requiresHumanApproval: true, selfModification: false },
    nextStep: "Try: Siva SCAN repo, or Siva FIX <path.js> ...",
  });
}
