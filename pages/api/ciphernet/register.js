// pages/api/ciphernet/register.js

import { getDb } from "../../../firebaseAdmin.js";

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function handler(req, res) {
  if (process.env.ENABLE_CIPHER_NET !== "true") {
    return res.status(503).json({ error: "CipherNet disabled" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      ownerId = "jim",
      name,
      slug,
      description = "",
      type = "agent",
      domain,
      endpointType,
      endpointRef,
      pricePerCall = 0,
      keywords = [],
    } = req.body || {};

    if (!name || !domain || !endpointType || !endpointRef) {
      return res.status(400).json({
        error: "Missing required fields: name, domain, endpointType, endpointRef",
      });
    }

    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const cleanSlug = slugify(slug || name);

    const existing = await db
      .collection("ciphernet_nodes")
      .where("slug", "==", cleanSlug)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: "Slug already exists" });
    }

    const doc = await db.collection("ciphernet_nodes").add({
      ownerId,
      slug: cleanSlug,
      name,
      description,
      type,
      domain,
      endpointType,
      endpointRef,
      pricePerCall: Number(pricePerCall || 0),
      verified: false,
      active: true,
      keywords: Array.isArray(keywords) ? keywords : [],
      avgScore: 0,
      totalRuns: 0,
      successRate: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      nodeId: doc.id,
      slug: cleanSlug,
    });
  } catch (err) {
    console.error("CipherNet register error:", err);
    return res.status(500).json({ error: err.message || "Register failed" });
  }
}
