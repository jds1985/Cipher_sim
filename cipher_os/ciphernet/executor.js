// cipher_os/ciphernet/executor.js

import { INTERNAL_NODES } from "./internalNodes.js";

// 🔧 helper to extract numbers from message text
function extractNumber(text, key) {
  const regex = new RegExp(`${key}\\s*(\\d+\\.?\\d*)`, "i");
  const match = text.match(regex);
  return match ? Number(match[1]) : null;
}

// 🧠 local fallback handlers (in case not defined in INTERNAL_NODES)
const LOCAL_NODE_HANDLERS = {
  financing_v1: async (payload) => {
    const message = payload?.message || "";

    const price = extractNumber(message, "price") || 0;
    const rate = 0.065 / 12;
    const term = 30 * 12;

    const monthlyPayment =
      price > 0
        ? (price * rate) / (1 - Math.pow(1 + rate, -term))
        : 0;

    return {
      monthlyPayment: Math.round(monthlyPayment),
      estimatedCashNeeded: Math.round(price * 0.2),
    };
  },

  rental_risk_v1: async (payload) => {
    const message = payload?.message || "";

    const rent = extractNumber(message, "rent") || 0;
    const expenses = extractNumber(message, "expenses") || 0;

    const ratio = rent > 0 ? expenses / rent : 0;

    let risk = "low";
    if (ratio > 0.6) risk = "medium";
    if (ratio > 0.8) risk = "high";

    return {
      expenseRatio: ratio,
      risk,
    };
  },
};

export async function executeCipherNetNode(node, payload) {
  const start = Date.now();

  if (node.endpointType === "internal") {
    // 🔥 try main registry first
    let fn = INTERNAL_NODES[node.endpointRef];

    // 🔥 fallback to local handlers if missing
    if (!fn) {
      fn = LOCAL_NODE_HANDLERS[node.endpointRef];
    }

    if (!fn) {
      throw new Error("NODE_HANDLER_NOT_FOUND");
    }

    const result = await fn(payload);

    return {
      ok: true,
      result,
      latencyMs: Date.now() - start,
    };
  }

  throw new Error("UNSUPPORTED_ENDPOINT_TYPE");
}
