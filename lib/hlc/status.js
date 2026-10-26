// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
/** Classification helpers for the output cards. Thresholds are the dashboard spec's. Status is never colour-only. */

/** Green > 50, Yellow 25–50 (inclusive), Red < 25. */
export function classifyRul(cycles) {
  if (cycles > 50) return { band: "HEALTHY", tone: "ok", icon: "✔", description: "More than 50 cycles of estimated life remain." };
  if (cycles >= 25) return { band: "WATCH", tone: "warn", icon: "⚠", description: "Between 25 and 50 cycles remain. Plan maintenance." };
  return { band: "ACT NOW", tone: "bad", icon: "✖", description: "Fewer than 25 cycles remain. Act now." };
}

export function classifyStatus(s) {
  switch (s) {
    case "NOMINAL":
      return { status: "NOMINAL", tone: "ok", icon: "✔" };
    case "WARNING":
      return { status: "WARNING", tone: "warn", icon: "⚠" };
    case "CRITICAL":
      return { status: "CRITICAL", tone: "bad", icon: "✖" };
    default:
      return { status: "UNKNOWN", tone: "unknown", icon: "?" };
  }
}

export const OJAS_MIN = 1.0;
export const OJAS_MAX = 8.0;

/** Position on the 1.0–8.0 scale as 0..100 (clamped), plus whether the raw value was out of range. */
export function ojasPosition(v) {
  const raw = ((v - OJAS_MIN) / (OJAS_MAX - OJAS_MIN)) * 100;
  return { percent: Math.min(100, Math.max(0, raw)), outOfRange: v < OJAS_MIN || v > OJAS_MAX };
}
