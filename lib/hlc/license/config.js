// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Shared constants for the HLC commercial licence (Stripe Checkout + one-time download link).

export const PRODUCT_KEY = "hlc-commercial";
export const PRODUCT_NAME = "HLC Commercial Production License";
export const UNIT_AMOUNT_CENTS = 49900; // $499 per asset per year
export const CURRENCY = "usd";
export const MIN_ASSETS = 1;
export const MAX_ASSETS = 50;

export const DOWNLOAD_FILE_KEY = "production";
export const DOWNLOAD_TTL_SECONDS = 72 * 60 * 60; // the emailed link is valid for 72 hours

export const DEFAULT_SITE_ORIGIN = "https://ciphercts.com";

/**
 * Master switch for selling. Server side: HLC_PURCHASE_ENABLED must be exactly "true" (any case) or /api/checkout answers 503.
 * The page uses the matching NEXT_PUBLIC_HLC_PURCHASE_ENABLED (inlined at build time) to show the Purchase button.
 * Default (unset) = purchase closed. To open sales, set BOTH variables to "true" and redeploy.
 */
export function isPurchaseEnabled(env = process.env) {
  return String((env && env.HLC_PURCHASE_ENABLED) || "").trim().toLowerCase() === "true";
}
