// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// POST /api/webhook: Stripe events. Logic: lib/hlc/license/webhook.js
import { createWebhookHandler } from "../../lib/hlc/license/webhook.js";

// Stripe signs the EXACT raw bytes, so Next's body parser must be off.
export const config = { api: { bodyParser: false } };

export default createWebhookHandler();
