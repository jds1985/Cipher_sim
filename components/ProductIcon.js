// © 2026 Cipher CTS. All Rights Reserved.
// Product icon family: "Hex Badge" (chosen by Jim). Source of truth: /workspace/brand/logo_sets/set1_hex_badge/*.svg
// Concepts, decorative only: always render the product name as text beside it.
import { useId } from "react";

const HEX = "M32 4.6 L55.7 18.3 L55.7 45.7 L32 59.4 L8.3 45.7 L8.3 18.3 Z";
const STOPS = [[0, "#1557F0"], [0.33, "#0E8CF8"], [0.55, "#2FDDCF"], [0.8, "#8CEF60"], [1, "#D4EA48"]];
const W = "#FFFFFF";
const L = "#8CEF60";
const SW = 3.7;
const LINE = { strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

// Glyphs are drawn in a 64 box and scaled to sit inside the hexagon (see the group transform below).
const GLYPHS = {
  // speech bubble with a padlock
  cipher: () => (
    <>
      <path d="M22 17 H42 A7 7 0 0 1 49 24 V36 A7 7 0 0 1 42 43 H32 L23 50 V43 H22 A7 7 0 0 1 15 36 V24 A7 7 0 0 1 22 17 Z" stroke={W} strokeWidth={SW} {...LINE} />
      <rect x="26" y="29" width="12" height="9" rx="2" fill={L} />
      <path d="M28.6 29 V26.6 A3.4 3.4 0 0 1 35.4 26.6 V29" stroke={L} strokeWidth={SW * 0.8} {...LINE} />
    </>
  ),
  // robot face with an antenna
  "cipher-bot": () => (
    <>
      <rect x="17" y="26" width="30" height="22" rx="7" stroke={W} strokeWidth={SW} fill="none" />
      <path d="M32 26 V20" stroke={L} strokeWidth={SW} {...LINE} />
      <circle cx="32" cy="16.8" r="3" fill={L} />
      <circle cx="25.5" cy="36" r="3" fill={W} />
      <circle cx="38.5" cy="36" r="3" fill={W} />
      <path d="M26.5 42 Q32 46.2 37.5 42" stroke={W} strokeWidth={SW * 0.85} {...LINE} />
    </>
  ),
  // hammer (build) with a spark
  "cipher-studio": () => (
    <>
      <g transform="rotate(45 32 32) translate(0 3)">
        <path d="M32 26 V47" stroke={W} strokeWidth="5.365" {...LINE} />
        <rect x="18.5" y="13" width="27" height="13" rx="3.5" fill={W} />
        <path d="M25 19.5 H39" stroke={L} strokeWidth="2.59" strokeLinecap="round" />
      </g>
      <path d="M19 15 Q19.91 21.09 26 22 Q19.91 22.91 19 29 Q18.09 22.91 12 22 Q18.09 21.09 19 15 Z" fill={L} />
    </>
  ),
  // service bell with ring marks
  "cipher-concierge": () => (
    <>
      <path d="M19 40 A13 13 0 0 1 45 40 Z" stroke={W} strokeWidth={SW} {...LINE} />
      <path d="M14.5 45.5 H49.5" stroke={W} strokeWidth={SW} {...LINE} />
      <path d="M32 27 V23.5" stroke={L} strokeWidth={SW} {...LINE} />
      <circle cx="32" cy="20.4" r="3" fill={L} />
      <path d="M46.5 22.5 L50 19.5 M17.5 22.5 L14 19.5" stroke={L} strokeWidth={SW * 0.8} {...LINE} />
    </>
  ),
  // gauge sitting on tiers
  hlc: () => (
    <>
      <path d="M15 36 A17 17 0 0 1 49 36" stroke={W} strokeWidth={SW} {...LINE} />
      <path d="M32 36 L39.8 26.2" stroke={L} strokeWidth={SW} {...LINE} />
      <circle cx="32" cy="36" r="3.4" fill={L} />
      <path d="M17 43 H47" stroke={W} strokeWidth={SW} {...LINE} />
      <path d="M23 49.5 H41" stroke={W} strokeWidth={SW} {...LINE} />
    </>
  ),
};

export const ICON_SLUGS = Object.keys(GLYPHS);

export default function ProductIcon({ slug, size = 40, className = "" }) {
  const id = useId().replace(/:/g, "");
  const Glyph = GLYPHS[slug];
  if (!Glyph) return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`pi${id}`} x1="6" y1="58" x2="58" y2="6" gradientUnits="userSpaceOnUse">
          {STOPS.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
      </defs>
      <path d={HEX} stroke={`url(#pi${id})`} strokeWidth="3.8" strokeLinejoin="round" />
      <g transform="translate(2.6 3.2) scale(0.92)"><Glyph /></g>
    </svg>
  );
}
