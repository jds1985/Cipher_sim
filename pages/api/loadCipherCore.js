import fs from "fs";
import path from "path";

export default async function loadCipherCore() {
  try {
    const basePath = path.join(process.cwd(), "cipher_core");
    const manifestPath = path.join(basePath, "core_manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    const cores = [];

    for (const core of manifest.cores) {
      const corePath = path.join(basePath, `${core.id}.json`);
      if (fs.existsSync(corePath)) {
        const data = JSON.parse(fs.readFileSync(corePath, "utf8"));
        cores.push({ ...core, data });
      }
    }

    return {
      status: "success",
      total_cores: cores.length,
      cores,
    };
  } catch (error) {
    console.error("⚠️ Cipher Core Loader Error:", error);
    return { status: "error", message: error.message };
  }
}
