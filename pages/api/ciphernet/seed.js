import admin from "firebase-admin";

// 🔥 USE YOUR EXISTING ENV (same as your other APIs)
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_BASE64, "base64").toString("utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const userId = req.body?.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const now = new Date();

    const baseNodes = [
      { content: "Midjourney is a leading AI image generator.", tags: ["ai", "image"] },
      { content: "DALL-E generates images from text prompts.", tags: ["ai", "image"] },
      { content: "Stable Diffusion is open-source and runs locally.", tags: ["ai", "image"] },
      { content: "Runway ML provides AI video and image tools.", tags: ["ai", "video"] },
      { content: "Leonardo AI is used for creative and game assets.", tags: ["ai", "image"] },
      { content: "Pika Labs creates AI-generated videos.", tags: ["ai", "video"] },
      { content: "Synthesia creates AI avatar videos.", tags: ["ai", "video"] },
      { content: "ChatGPT is useful for coding and writing.", tags: ["ai"] },
      { content: "Claude is strong for reasoning tasks.", tags: ["ai"] },
      { content: "Gemini handles large documents well.", tags: ["ai"] },
      { content: "Zapier automates workflows.", tags: ["automation"] },
      { content: "Make.com is a visual automation tool.", tags: ["automation"] },
      { content: "Notion AI improves productivity.", tags: ["productivity"] },
      { content: "Cursor AI helps developers write code.", tags: ["coding"] },
      { content: "Replit lets you build apps in browser.", tags: ["coding"] },
      { content: "Figma is used for UI design.", tags: ["design"] },
      { content: "Canva offers AI design tools.", tags: ["design"] },
    ];

    // expand to ~50
    const expanded = [];
    for (let i = 0; i < 3; i++) {
      baseNodes.forEach((n, idx) => {
        expanded.push({
          ...n,
          content: `${n.content} (v${i}-${idx})`,
        });
      });
    }

    const batch = db.batch();

    expanded.forEach((node) => {
      const ref = db
        .collection("memory_nodes")
        .doc(userId)
        .collection("nodes")
        .doc();

      batch.set(ref, {
        content: node.content,
        tags: node.tags,
        type: "knowledge",
        importance: 0.8,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      count: expanded.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
