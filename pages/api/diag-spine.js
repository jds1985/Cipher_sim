export default async function handler(req, res) {
  return res.status(200).json({
    status: "DIAG_SPINE_DISABLED",
    reason: "Temporarily stubbed to unblock build"
  });
}
