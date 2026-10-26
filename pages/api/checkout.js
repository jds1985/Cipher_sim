// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// POST /api/checkout: Stripe Checkout for the HLC Commercial Production License. Logic: lib/hlc/license/checkout.js
import { createCheckoutHandler } from "../../lib/hlc/license/checkout.js";

export default createCheckoutHandler();
