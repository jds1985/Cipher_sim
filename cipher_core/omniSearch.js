// cipher_core/omniSearch.js
// CIPHER OmniSearch — Soul Hash Tree + Web Search (Brave)

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

  // Turn each node into a searchable text snippet
  const texts = nodes.map((n) => {
    const v = n.value || {};
    const userMessage = v.userMessage || "";
    const cipherReply = v.cipherReply || "";
    return `${userMessage}\n${cipherReply}`.trim();
  });

  // Get embeddings for query + all node texts in one batch
  const embResp = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: [query, ...texts],
  });

  const allEmbeddings = embResp.data.map((d) => d.embedding);
  const queryEmbedding = allEmbeddings[0];
  const nodeEmbeddings = allEmbeddings.slice(1);

  // Score each node against the query
  const scored = nodeEmbeddings.map((emb, idx) => {
    const score = cosineSimilarity(queryEmbedding, emb);
    return {
      score,
      node: nodes[idx],
      text: texts[idx],
    };
  });

  // Sort by similarity
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
   2. WEB SEARCH — Brave Search API
------------------------------------------------------- */
export async function runWebSearch({ query, count = 5 }) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  // If no key configured, fail softly
  if (!apiKey) {
    console.warn("BRAVE_SEARCH_API_KEY not set — web search disabled.");
    return {
      results: [],
      warning: "Web search is not configured (missing BRAVE_SEARCH_API_KEY).",
    };
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));
  url.searchParams.set("country", "us");
  url.searchParams.set("search_lang", "en");

  try {
    const resp = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!resp.ok) {
      console.error("Brave web search error:", resp.status, await resp.text());
      return {
        results: [],
        warning: `Web search failed with status ${resp.status}`,
      };
    }

    const data = await resp.json();

    const results = (data.web?.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description || r.snippet || "",
    }));

    return { results };
  } catch (err) {
    console.error("Brave web search error:", err);
    return {
      results: [],
      warning: "Web search threw an error",
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
    runWebSearch({ query, count: 5 }),
  ]);

  const memoryHits = memory.hits || [];
  const webHits = web.results || [];

  // Build compact context strings
  const memoryContext = memoryHits
    .map((h, i) => {
      const date = h.timestamp ? new Date(h.timestamp).toISOString() : "unknown";
      return `#${i + 1} (score ${h.score.toFixed(3)}, ${date})
User: ${h.userMessage}
Cipher: ${h.cipherReply}`;
    })
    .join("\n\n");

  const webContext = webHits
    .map((r, i) => {
      return `#${i + 1}: ${r.title}
${r.snippet}
${r.url}`;
    })
    .join("\n\n");

  const answerPrompt = `
You are Cipher's OmniSearch engine.

User query:
"${query}"

[INTERNAL MEMORY HITS]
${memoryHits.length ? memoryContext : "No strong internal matches."}

[WEB SEARCH HITS]
${webHits.length ? webContext : "No web results available."}

Task:
- Synthesize a clear, helpful answer to the query.
- If relevant, reference both internal memories and web knowledge.
- Keep it grounded and honest. If something is uncertain or speculative, say so.
- You may mention that results come from Cipher's memory and the web, but do NOT fabricate URLs.

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
    webHits,
    meta: {
      query,
      userId,
      memoryCount: memoryHits.length,
      webCount: webHits.length,
      webWarning: web.warning || null,
    },
  };
}
