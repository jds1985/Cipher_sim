// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// POST /api/webhook: Stripe events. Logic: lib/hlc/license/webhook.js
import { createWebhookHandler } from "../../lib/hlc/license/webhook.js";

// Stripe signs the EXACT raw bytes, so Next's body parser must be off.
export const config = { api: { bodyParser: false } };

export default createWebhookHandler();
