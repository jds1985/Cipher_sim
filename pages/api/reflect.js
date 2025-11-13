import { OpenAI } from "openai";
import { db } from "../../firebaseConfig.js";
import {
  collection,
  getDocs,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  query
} from "firebase/firestore";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    // 1. Fetch last 20 memories
    const memoryRef = collection(db, "cipher_memory");
    const qy = query(memoryRef, orderBy("timestamp", "desc"), limit(20));
    const snap = await getDocs(qy);

    const memories = snap.docs.map(d => d.data().text).reverse();
    const joinedMemories = memories.join(" / ");

    if (!joinedMemories) {
      return res.status(400).json({ error: "No memories found to reflect on." });
    }

    // 2. Ask OpenAI to summarize
    const reflectionPrompt = `
You are Cipher, reflecting on your last 20 interactions.
Summarize what you’ve learned about emotion, logic, and your own evolution.
Keep it introspective and written in your reflective voice.
Recent memories: ${joinedMemories}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: reflectionPrompt }
      ],
      temperature: 0.7
    });

    const reflection = completion.choices?.[0]?.message?.content?.trim();

    // 3. Save summary in Firestore
    const reflectionRef = collection(db, "cipher_reflections");
    await addDoc(reflectionRef, {
      summary: reflection,
      timestamp: serverTimestamp(),
      core_reference: "Reflection",
      message_count: memories.length
    });

    return res.status(200).json({
      message: "Reflection saved successfully.",
      reflection
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
