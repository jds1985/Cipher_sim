// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Buyer-facing messages for the Stripe return URLs of the paid licence flow (/hlc?license=success|cancelled#license).
// Pure functions, so they can be tested without a browser. Nothing here reads, shows or sends the session_id.
import { DOWNLOAD_TTL_SECONDS } from "./config.js";

export const SUPPORT_EMAIL = "team@ciphercts.com";
export const ARRIVAL_WAIT_MINUTES = 15;

/** Returns "success", "cancelled" or null from a query string such as "?license=success&session_id=...". Anything else is ignored. */
export function licenseBannerFromSearch(search) {
  const v = new URLSearchParams(typeof search === "string" ? search : "").get("license");
  return v === "success" || v === "cancelled" ? v : null;
}

const HOURS = Math.round(DOWNLOAD_TTL_SECONDS / 3600);

export const LICENSE_BANNER_COPY = {
  success: {
    title: "Payment received. Thank you.",
    lines: [
      "A download link is being emailed to the address you used at checkout.",
      `The link works one time. It expires after ${HOURS} hours.`,
      "Check your spam folder if you do not see it.",
      `If it has not arrived within ${ARRIVAL_WAIT_MINUTES} minutes, write to ${SUPPORT_EMAIL}.`,
    ],
  },
  cancelled: {
    title: "Checkout cancelled. You were not charged.",
    lines: ["You can purchase whenever you are ready."],
  },
};
