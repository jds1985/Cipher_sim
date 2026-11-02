// Space Grotesk, bundled locally (no Google Fonts download at build time). Same latin variable file Google serves.
// License: SIL Open Font License 1.1, see ./OFL.txt.
import localFont from "next/font/local";

export const spaceGrotesk = localFont({
  src: "./SpaceGrotesk-latin.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});
