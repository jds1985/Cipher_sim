// © 2026 Cipher CTS. All Rights Reserved.
// Product icon family (CONCEPTS, easily swapped). Generated from /workspace/brand/product_icons/gen_product_icons.py.
// Decorative only: always render the product name as text beside it.
import { useId } from "react";

const HEX = "M32 4.6 L55.7 18.3 L55.7 45.7 L32 59.4 L8.3 45.7 L8.3 18.3 Z";
const STOPS = [[0, "#1557F0"], [0.33, "#0E8CF8"], [0.55, "#2FDDCF"], [0.8, "#8CEF60"], [1, "#D4EA48"]];
const GLYPHS = {
  "cipher": [{"d": "M21 23.5 H43 A3 3 0 0 1 46 26.5 V37 A3 3 0 0 1 43 40 H33 L26 46 V40 H21 A3 3 0 0 1 18 37 V26.5 A3 3 0 0 1 21 23.5 Z", "c": "#FFFFFF"}, {"dot": [32, 31.8, 2.4]}],
  "cipher-bot": [{"d": "M23 23.5 L34 32 L23 40.5", "c": "#FFFFFF"}, {"d": "M37 41 H46", "c": "#8CEF60"}],
  "cipher-studio": [{"d": "M30 19 C31 27 34 30 42 31.5 C34 33 31 36 30 44 C29 36 26 33 18 31.5 C26 30 29 27 30 19 Z", "c": "#FFFFFF"}, {"d": "M44 17.5 V25 M40.2 21.2 H47.8", "c": "#8CEF60"}],
  "cipher-concierge": [{"d": "M20.5 40 A11.5 11.5 0 0 1 43.5 40 Z", "c": "#FFFFFF"}, {"d": "M17 45 H47", "c": "#FFFFFF"}, {"d": "M32 22 V25.5", "c": "#8CEF60"}],
  "hlc": [{"d": "M32 18.5 L45 25 L32 31.5 L19 25 Z", "c": "#8CEF60"}, {"d": "M19 31.5 L32 38 L45 31.5", "c": "#FFFFFF"}, {"d": "M19 38 L32 44.5 L45 38", "c": "#FFFFFF"}],
};

export const ICON_SLUGS = Object.keys(GLYPHS);

export default function ProductIcon({ slug, size = 40, className = "" }) {
  const id = useId().replace(/:/g, "");
  const glyph = GLYPHS[slug];
  if (!glyph) return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`pi${id}`} x1="6" y1="46" x2="58" y2="18" gradientUnits="userSpaceOnUse">
          {STOPS.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
      </defs>
      <path d={HEX} stroke={`url(#pi${id})`} strokeWidth="3.6" strokeLinejoin="round" />
      {glyph.map((g, i) => g.dot
        ? <circle key={i} cx={g.dot[0]} cy={g.dot[1]} r={g.dot[2]} fill="#8CEF60" />
        : <path key={i} d={g.d} stroke={g.c} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
  );
}
