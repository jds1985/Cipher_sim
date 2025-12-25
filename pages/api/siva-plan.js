export default function handler(req, res) {
  return res.status(200).json({
    status: "SIVA_PLAN_ROUTE_HIT",
    time: new Date().toISOString(),
    body: req.body || null,
  });
}
