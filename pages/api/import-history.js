// pages/api/import-history.js

import { createHash } from "crypto";
import { detectImporter } from "../../lib/importers/registry";
import { getDb } from "../../firebaseAdmin.js";

const CHUNK_SIZE = 80;

function hashId(input) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function chunkMessages(messages, size = CHUNK_SIZE) {
  const out = [];
  for (let i = 0; i < messages.length; i += size) out.push(messages.slice(i, i + size));
  return out;
}

function chunkToMemoryText(chunk = []) {
  // Compact, LLM-friendly text blob
  const lines = [];
  for (const m of chunk) {
    const role = (m?.role || "").toLowerCase();
    if (role !== "user" && role !== "assistant") continue;
    const label = role === "user" ? "User" : "Assistant";
    const text = String(m?.content || "").trim();
    if (!text) continue;
    lines.push(`${label}: ${text}`);
  }
  // keep it reasonably bounded
  return lines.join("\n").slice(0, 12000);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const db = getDb();
    if (!db) return res.status(500).json({ error: "Firestore unavailable" });

    const { userId, rawJson } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!rawJson) return res.status(400).json({ error: "Missing rawJson" });

    let raw;
    try {
      raw = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
    } catch {
      return res.status(400).json({ error: "Invalid JSON file" });
    }

    const importer = detectImporter(raw);
    const normalized = importer.parse(raw);

    if (!normalized?.threads || normalized.threads.length === 0) {
      return res.status(200).json({
        ok: true,
        source: normalized?.source || importer?.id || "unknown",
        importedThreads: 0,
        importedNodes: 0,
        memoryNodesWritten: 0,
      });
    }

    let importedThreads = 0;
    let importedNodes = 0;
    let memoryNodesWritten = 0;

    for (const t of normalized.threads) {
      if (!t?.messages || t.messages.length === 0) continue;

      const source = normalized.source || importer.id || "unknown";
      const sourceThreadId = t.sourceThreadId || `${t.title || "thread"}-${t.createdAt || Date.now()}`;

      // Stable ids
      const branchId = hashId(`${userId}:${source}:${sourceThreadId}`);
      const branchRef = db.collection("cipher_branches").doc(branchId);

      const chunks = chunkMessages(t.messages, CHUNK_SIZE);
      const nodeIds = [];

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];

        const contentHash = hashId(
          JSON.stringify(chunk.map((m) => [m?.role || "", m?.ts || "", m?.content || ""]))
        );

        const nodeId = hashId(`${branchId}:${ci}:${contentHash}`);
        nodeIds.push(nodeId);

        // 1) Archive node (cipher_cores)
        const coreRef = db.collection("cipher_cores").doc(nodeId);

        await coreRef.set(
          {
            userId,
            branchId,
            source,
            sourceThreadId,
            title: t.title || null,
            chunkIndex: ci,
            createdAt: t.createdAt || Date.now() / 1000,
            importedAt: Date.now(),
            messages: chunk,
            summary: null,
            tags: [],
          },
          { merge: true }
        );

        importedNodes += 1;

        // 2) Usable memory node (memory_nodes) so chat.js can load it immediately
        const memText = chunkToMemoryText(chunk);
        if (memText) {
          const memRef = db
            .collection("memory_nodes")
            .doc(userId)
            .collection("nodes")
            .doc(nodeId);

          await memRef.set(
            {
              type: "import",
              importance: "medium",
              content: memText,
              tags: ["import", source],
              source: `import:${source}`,
              strength: 3,
              weight: 3,
              locked: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            { merge: true }
          );

          memoryNodesWritten += 1;
        }
      }

      // Branch summary doc (cipher_branches)
      await branchRef.set(
        {
          userId,
          source,
          sourceThreadId,
          title: t.title || null,
          createdAt: t.createdAt || Date.now() / 1000,
          importedAt: Date.now(),
          nodeIds,
          messageCount: t.messages.length,
          nodeCount: nodeIds.length,
          isImported: true,
        },
        { merge: true }
      );

      importedThreads += 1;
    }

    return res.status(200).json({
      ok: true,
      source: normalized.source || importer.id || "unknown",
      importedThreads,
      importedNodes,
      memoryNodesWritten,
    });
  } catch (err) {
    console.error("Import error:", err);
    return res.status(500).json({
      error: "Import failed",
      details: err?.message || String(err),
    });
  }
}
