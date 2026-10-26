// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
/** Display helpers for the gauges. Status is never colour-only: every tone carries a word and an icon. */

export function classifyStatus(s) {
  switch (s) {
    case "NOMINAL":
      return { status: "NOMINAL", tone: "ok", icon: "✔" };
    case "WARNING":
      return { status: "WARNING", tone: "warn", icon: "⚠" };
    case "CRITICAL":
      return { status: "CRITICAL", tone: "bad", icon: "✖" };
    default:
      return { status: "UNKNOWN", tone: "idle", icon: "?" };
  }
}

/** The dial is drawn from 0 to this many cycles (the training labels are capped at 125). */
export const RUL_DIAL_MAX = 125;
/** Dial position 0..100 (clamped). */
export function dialPercent(cycles) {
  return Math.min(100, Math.max(0, (cycles / RUL_DIAL_MAX) * 100));
}

/**
 * Systemic Friction (Ojas Ledger) meter: starts at the 1.0 baseline. The engine clamps Ojas to 1.0–8.0, but
 * on real C-MAPSS FD001 data it stays between about 1.5 and 2.6, so the DISPLAY scale ends at 3.0 (values above are pinned to the end).
 */
export const OJAS_BASELINE = 1.0;
export const OJAS_DISPLAY_MAX = 3.0;
export function ojasPercent(v) {
  return Math.min(100, Math.max(0, ((v - OJAS_BASELINE) / (OJAS_DISPLAY_MAX - OJAS_BASELINE)) * 100));
}
