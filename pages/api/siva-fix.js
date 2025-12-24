// pages/api/siva-fix.js
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walk(full, files);
    } else if (full.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jsFiles = walk(path.join(ROOT, "pages"))
    .concat(walk(path.join(ROOT, "components")));

  const issues = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, "utf8");

    const matches = content.matchAll(/from\s+['"](.+?)['"]/g);
    for (const m of matches) {
      const importPath = m[1];
      if (importPath.startsWith(".")) {
        const resolved = path.resolve(path.dirname(file), importPath);
        if (
          !fs.existsSync(resolved) &&
          !fs.existsSync(resolved + ".js") &&
          !fs.existsSync(path.join(resolved, "index.js"))
        ) {
          issues.push({
            file: file.replace(ROOT, ""),
            missing: importPath,
          });
        }
      }
    }
  }

  return res.status(200).json({
    status: "SIVA_FIX_REPORT",
    issues,
    count: issues.length,
  });
}
