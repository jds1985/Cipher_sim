// Writes lib/fonts/SpaceGrotesk-latin.woff2 from the committed base64 copy, so builds never download fonts.
// (Stored as base64 text because the repo tooling commits text files only.) Font: Space Grotesk, SIL OFL 1.1, see lib/fonts/OFL.txt.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const dir = new URL("../lib/fonts/", import.meta.url);
const buf = Buffer.from(readFileSync(new URL("SpaceGrotesk-latin.woff2.b64", dir), "utf8"), "base64");
const sha = createHash("sha256").update(buf).digest("hex");
if (sha !== "0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d") throw new Error("Space Grotesk font copy is damaged (sha256 mismatch)");
writeFileSync(new URL("SpaceGrotesk-latin.woff2", dir), buf);
