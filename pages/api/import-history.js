// pages/api/import-history.js

import { createHash } from "crypto";
import { detectImporter } from "../../lib/importers/registry";
// NOTE: firebaseAdmin.js lives at the project root (not /lib)
import { getDb } from "../../firebaseAdmin";

const CHUNK_SIZE = 80;

function hashId(input) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function chunkMessages(messages, size = CHUNK_SIZE) {
  const out = [];

  for (let i = 0; i < messages.length; i += size) {
    out.push(messages.slice(i, i + size));
  }

  return out;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const db = getDb();

    if (!db) {
      return res.status(500).json({
        error: "Firestore unavailable",
      });
    }

    const { userId, rawJson } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        error: "Missing userId",
      });
    }

    if (!rawJson) {
      return res.status(400).json({
        error: "Missing rawJson",
      });
    }

    let raw;

    try {
      raw = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
    } catch (e) {
      return res.status(400).json({
        error: "Invalid JSON file",
      });
    }

    const importer = detectImporter(raw);

    if (!importer) {
      return res.status(400).json({
        error: "Unsupported export format",
      });
    }

    const normalized = importer.parse(raw);

    if (!normalized?.threads || normalized.threads.length === 0) {
      return res.status(200).json({
        ok: true,
        source: normalized?.source || importer.id || "unknown",
        importedThreads: 0,
        importedNodes: 0,
      });
    }

    const threads = normalized.threads;

    let importedThreads = 0;
    let importedNodes = 0;

    for (const t of threads) {
      if (!t.messages || t.messages.length === 0) continue;

      const source = normalized.source || importer.id || "unknown";

      const branchId = hashId(
        `${userId}:${source}:${t.sourceThreadId || t.title}`
      );

      const branchRef = db.collection("cipher_branches").doc(branchId);

      const chunks = chunkMessages(t.messages, CHUNK_SIZE);

      const nodeIds = [];

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];

        const contentHash = hashId(
          JSON.stringify(
            chunk.map((m) => [m.role || "", m.ts || "", m.content || ""])
          )
        );

        const nodeId = hashId(`${branchId}:${ci}:${contentHash}`);

        nodeIds.push(nodeId);

        const coreRef = db.collection("cipher_cores").doc(nodeId);

        await coreRef.set(
          {
            userId,
            branchId,
            source,
            sourceThreadId: t.sourceThreadId || null,
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
      }

      await branchRef.set(
        {
          userId,
          source,
          sourceThreadId: t.sourceThreadId || null,
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
    });
  } catch (err) {
    console.error("Import error:", err);

    return res.status(500).json({
      error: "Import failed",
      details: err?.message || String(err),
    });
  }
}
