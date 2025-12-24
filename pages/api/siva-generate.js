// pages/api/siva-generate.js
// SIVA — Code Generator (NO FILE WRITES)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const { taskId, route } = req.body;

  if (!taskId || !route) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  return res.status(200).json({
    status: "SIVA_GENERATE_READY",
    taskId,
    route,
    files: [
      {
        path: "pages/settings.js",
        content: "// TODO: Generated Settings page"
      },
      {
        path: "components/SettingsPanel.js",
        content: "// TODO: Generated Settings panel"
      }
    ],
    note: "Dry-run only. No files written."
  });
}
