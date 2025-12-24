export default async function handler(req, res) {
  return res.status(200).json({
    status: "DIAGNOSTIC_OK",
    message: "Basic diagnostic online"
  });
}
