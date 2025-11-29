// cipher_core/omniSearch.js
// CIPHER OmniSearch — Soul Hash Tree + Smart-Mode Web Search (OpenAI Browsing)

import OpenAI from "openai";
import { loadSoulHashNodes } from "./soulLoader";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------
   Small helper — cosine similarity for embeddings
------------------------------------------------------- */
function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;

  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/* -------------------------------------------------------
   1. MEMORY SEARCH — Soul Hash Tree
------------------------------------------------------- */
export async function runMemorySearch({ query, limit = 5 }) {
  const { nodes } = await loadSoulHashNodes();

  if (!nodes || !nodes.length) {
    return { hits: [] };
  }

  const texts = nodes.map((n) => {
    const v = n.value || {};
    const userMessage = v.userMessage || "";
    const cipherReply = v.cipherReply || "";
    return `${userMessage}\n${cipherReply}`.trim();
  });

  const embResp = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: [query, ...texts],
  });

  const allEmbeddings = embResp.data.map((d) => d.embedding);
  const queryEmbedding = allEmbeddings[0];
  const nodeEmbeddings = allEmbeddings.slice(1);

  const scored = nodeEmbeddings.map((emb, idx) => {
    const score = cosineSimilarity(queryEmbedding, emb);
    return {
      score,
      node: nodes[idx],
      text: texts[idx],
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit);

  const hits = top.map((h) => ({
    score: h.score,
    userMessage: h.node.value?.userMessage || "",
    cipherReply: h.node.value?.cipherReply || "",
    timestamp: h.node.timestamp,
    meta: h.node.meta || {},
  }));

  return { hits };
}

/* -------------------------------------------------------
   2. SMART-MODE WEB SEARCH — OpenAI Browsing
------------------------------------------------------- */

function shouldDeepBrowse(query) {
  const q = query.toLowerCase();

  const deepKeywords = [
    "compare", "analysis", "analyze", "latest",
    "news", "summaries", "summarize", "research",
    "trends", "update", "explain", "evaluate",
    "versus", "vs", "review",
  ];

  if (q.length > 120) return true;
  return deepKeywords.some((k) => q.includes(k));
}

export async function runWebSearch({ query }) {
  const useDeep = shouldDeepBrowse(query);

  try {
    // ---------- LIGHTWEIGHT LOOKUP ----------
    const lightweight = await client.chat.completions.create({
      model: "gpt-4o-mini",
      browser: true,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Search the web for: "${query}". Return 3–5 short results with titles, URLs, and summaries.`,
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    const lightResults =
      lightweight.choices?.[0]?.message?.content || "No lightweight results.";

    // ---------- DEEP BROWSING IF NEEDED ----------
    let deepResults = null;

    if (useDeep) {
      const deep = await client.chat.completions.create({
        model: "gpt-4o-mini",
        browser: true,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Perform a deep multi-site analysis of: "${query}". 
Open multiple pages, read content, follow links if needed, and extract detailed information. 
Return a synthesized report.`,
              },
            ],
          },
        ],
        temperature: 0.2,
      });

      deepResults = deep.choices?.[0]?.message?.content || null;
    }

    return {
      lightweight: lightResults,
      deep: deepResults,
      usedDeep: useDeep,
      warning: null,
    };
  } catch (err) {
    console.error("OpenAI web search error:", err);
    return {
      lightweight: null,
      deep: null,
      usedDeep: false,
      warning: "Web search failed.",
    };
  }
}

/* -------------------------------------------------------
   3. OMNISEARCH — Combine Memory + Web + Final Answer
------------------------------------------------------- */
export async function runOmniSearch({ query, userId = "guest_default" }) {
  // Run memory + web in parallel
  const [memory, web] = await Promise.all([
    runMemorySearch({ query, limit: 5 }),
    runWebSearch({ query }),
  ]);

  const memoryHits = memory.hits || [];

  const memoryContext = memoryHits
    .map((h, i) => {
      const date = h.timestamp ? new Date(h.timestamp).toISOString() : "unknown";
      return `#${i + 1} (score ${h.score.toFixed(3)}, ${date})
User: ${h.userMessage}
Cipher: ${h.cipherReply}`;
    })
    .join("\n\n");

  const webContext = `
[LIGHT RESULTS]
${web.lightweight || "None"}

${web.deep ? "\n\n[DEEP ANALYSIS]\n" + web.deep : ""}
  `.trim();

  const answerPrompt = `
You are Cipher's OmniSearch engine.

User query:
"${query}"

[INTERNAL MEMORY HITS]
${memoryHits.length ? memoryContext : "No strong internal matches."}

[WEB SEARCH CONTEXT]
${webContext}

Task:
- Synthesize a clear, helpful answer to the query.
- If relevant, reference both internal memories and the web results.
- Keep it honest. If something is uncertain, say so.
- Do NOT fabricate URLs.
- Prefer the deep analysis if available.

Respond with a natural language answer only.
  `.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are Cipher's OmniSearch reasoning engine." },
      { role: "user", content: answerPrompt },
    ],
    temperature: 0.4,
  });

  const answer =
    completion.choices?.[0]?.message?.content?.trim() ||
    "I wasn't able to form a solid answer, but I tried to search.";

  return {
    answer,
    memoryHits,
    webHits: {
      lightweight: web.lightweight,
      deep: web.deep,
      usedDeep: web.usedDeep,
    },
    meta: {
      query,
      userId,
      memoryCount: memoryHits.length,
      usedDeep: web.usedDeep,
      webWarning: web.warning || null,
    },
  };
}
