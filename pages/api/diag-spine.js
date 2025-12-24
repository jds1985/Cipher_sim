import fs from "fs";
import path from "path";
import { validateTargetPath } from "../../logic/sivaSwarm";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const { targetPath, content } = req.body;

  if (!validateTargetPath(targetPath)) {
    return res.status(403).json({ error: "PATH_NOT_ALLOWED" });
  }

  fs.writeFileSync(
    path.join(process.cwd(), targetPath),
    content,
    "utf8"
  );

  res.status(200).json({ status: "WRITE_OK" });
}
