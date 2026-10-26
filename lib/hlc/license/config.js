// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
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
