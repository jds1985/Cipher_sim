// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// GET/POST /api/download: signed one-time link to the private production package. Logic: lib/hlc/license/download.js
import { createDownloadHandler } from "../../lib/hlc/license/download.js";

export default createDownloadHandler();
