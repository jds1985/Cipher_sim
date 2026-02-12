export const runtime = "nodejs";

import { getTelemetry, clearTelemetry } from "../../cipher_os/runtime/telemetryState.js";

export default function handler(req, res) {
  // Optional: allow clearing from the dashboard
  if (req.method === "POST" && req.query?.action === "clear") {
    clearTelemetry();
    return res.status(200).json({ ok: true });
  }

  const data = getTelemetry();
  res.status(200).json(data);
}
