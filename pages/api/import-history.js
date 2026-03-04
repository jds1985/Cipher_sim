// pages/api/import-history.js

import crypto from "crypto";
import { detectImporter } from "../../lib/importers/registry";
import { adminDb } from "../../lib/firebaseAdmin"; // adjust to your admin init path

const CHUNK_SIZE = 80; // within your 50–100 memory

function hashId(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 24);
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
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { userId, rawJson, mode } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!rawJson) return res.status(400).json({ error: "Missing rawJson" });

    // rawJson can be an object or a string
    const raw = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;

    const importer = detectImporter(raw);
    const normalized = importer.parse(raw);

    if (!normalized.threads || normalized.threads.length === 0) {
      return res.status(200).json({ ok: true, source: normalized.source, importedThreads: 0, importedNodes: 0 });
    }

    // If mode === "singleThread", raw is already one conversation; otherwise many
    const threads = normalized.threads;

    let importedThreads = 0;
    let importedNodes = 0;

    for (const t of threads) {
      const source = normalized.source || importer.id || "unknown";

      // Stable branch id per user+source+thread
      const branchId = hashId(`${userId}:${source}:${t.sourceThreadId}`);

      // Upsert branch doc
      const branchRef = adminDb.collection("cipher_branches").doc(branchId);

      // Chunk messages into nodes
      const chunks = chunkMessages(t.messages, CHUNK_SIZE);

      const nodeIds = [];

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];

        // Stable node id per branch+chunkIndex+content hash
        const contentHash = hashId(JSON.stringify(chunk.map((m) => [m.role, m.ts, m.content])));
        const nodeId = hashId(`${branchId}:${ci}:${contentHash}`);

        nodeIds.push(nodeId);

        const coreRef = adminDb.collection("cipher_cores").doc(nodeId);

        await coreRef.set(
          {
            userId,
            branchId,
            source,
            sourceThreadId: t.sourceThreadId,
            title: t.title,
            chunkIndex: ci,
            createdAt: t.createdAt || Date.now() / 1000,
            importedAt: Date.now(),
            messages: chunk,
            // reserved for later: embeddings, summaries, tags
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
          sourceThreadId: t.sourceThreadId,
          title: t.title,
          createdAt: t.createdAt || Date.now() / 1000,
          importedAt: Date.now(),
          nodeIds,
          messageCount: t.messages.length,
          nodeCount: nodeIds.length,
          // a flag so you can show it in “Imported Conversations”
          isImported: true,
        },
        { merge: true }
      );

      importedThreads += 1;
    }

    return res.status(200).json({
      ok: true,
      source: normalized.source,
      importedThreads,
      importedNodes,
    });
  } catch (err) {
    console.error("Import error:", err);
    return res.status(500).json({ error: "Import failed", details: err?.message || String(err) });
  }
}
