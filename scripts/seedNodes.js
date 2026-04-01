import admin from "firebase-admin";
import serviceAccount from "./firebaseKey.json" assert { type: "json" };

// 🔥 INIT FIREBASE
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ⚡ CHANGE THIS TO YOUR USER ID
const USER_ID = "REPLACE_WITH_YOUR_USER_ID";

const now = new Date();

// 🔥 BASE NODE DATA
const baseNodes = [
  { content: "Midjourney is a leading AI image generator known for artistic outputs.", tags: ["ai", "image", "tools"] },
  { content: "DALL-E generates realistic and creative images from text prompts.", tags: ["ai", "image"] },
  { content: "Stable Diffusion is open-source and can run locally.", tags: ["ai", "image"] },
  { content: "Runway ML offers AI tools for image and video editing.", tags: ["ai", "video", "tools"] },
  { content: "Leonardo AI focuses on game assets and creative visuals.", tags: ["ai", "image"] },
  { content: "Pika Labs generates AI videos from prompts.", tags: ["ai", "video"] },
  { content: "Synthesia creates AI videos using avatars.", tags: ["ai", "video"] },
  { content: "ChatGPT helps with coding, writing, and reasoning.", tags: ["ai", "tools"] },
  { content: "Claude is strong for reasoning and long-form responses.", tags: ["ai"] },
  { content: "Gemini handles large documents and context well.", tags: ["ai"] },
  { content: "Zapier automates workflows between apps.", tags: ["automation"] },
  { content: "Make.com is a visual automation tool similar to Zapier.", tags: ["automation"] },
  { content: "Notion AI enhances productivity and note-taking.", tags: ["productivity"] },
  { content: "Cursor AI helps developers write code faster.", tags: ["coding"] },
  { content: "Replit allows building apps in the browser.", tags: ["coding"] },
  { content: "Figma is used for UI and UX design.", tags: ["design"] },
  { content: "Canva offers simple AI-assisted design tools.", tags: ["design"] },
  { content: "AI tools fall into categories like image, video, text, and automation.", tags: ["ai"] },
];

// 🔁 EXPAND TO ~50 NODES
const expandedNodes = [];
for (let i = 0; i < 3; i++) {
  baseNodes.forEach((node, index) => {
    expandedNodes.push({
      ...node,
      content: `${node.content} (variant ${i}-${index})`,
    });
  });
}

// 🚀 SEED FUNCTION
async function seed() {
  const batch = db.batch();

  expandedNodes.forEach((node) => {
    const ref = db
      .collection("memory_nodes")
      .doc(USER_ID)
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

  console.log(`🔥 Seeded ${expandedNodes.length} nodes`);
}

// ▶️ RUN
seed().catch(console.error);
