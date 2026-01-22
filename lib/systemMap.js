import fs from "fs";

export function getSystemMap() {
  const raw = fs.readFileSync("_meta/repomap.json", "utf8");
  return JSON.parse(raw);
}
