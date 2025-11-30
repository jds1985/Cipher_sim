// cipher_core/deviceContext.js
// Load last known device context for a user

import { db } from "../firebaseAdmin";

export async function loadDeviceContext(userId = "jim_default") {
  try {
    const ref = db.collection("device_context").doc(userId);
    const snap = await ref.get();

    if (!snap.exists) {
      return {
        summary: "No device context stored yet.",
        raw: null,
      };
    }

    const data = snap.data() || {};

    const battery =
      data.batteryLevel != null ? `${data.batteryLevel}%` : "unknown";
    const charging =
      data.charging === true
        ? "charging"
        : data.charging === false
        ? "not charging"
        : "unknown";
    const online =
      data.online === true
        ? "online"
        : data.online === false
        ? "offline"
        : "unknown";
    const network = data.networkType || "unknown";
    const orientation = data.orientation || "unknown";
    const platform = data.platform || "unknown";
    const when = data.lastUpdated || "unknown time";

    const summary = `
Device status:
- Platform: ${platform}
- Battery: ${battery} (${charging})
- Network: ${online} via ${network}
- Orientation: ${orientation}
- Last updated: ${when}
`.trim();

    return {
      summary,
      raw: data,
    };
  } catch (err) {
    console.error("DeviceContext Load Error:", err);
    return {
      summary: "Error loading device context.",
      raw: null,
    };
  }
}
