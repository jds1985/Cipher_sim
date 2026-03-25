// cipher_os/ciphernet/executor.js

import { INTERNAL_NODES } from "./internalNodes.js";

export async function executeCipherNetNode(node, payload) {
  const start = Date.now();

  if (node.endpointType === "internal") {
    const fn = INTERNAL_NODES[node.endpointRef];

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
