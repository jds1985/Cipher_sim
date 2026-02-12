import { getLastRun } from "../../../cipher_os/runtime/debugState.js";

export default function handler(req, res) {
  const data = getLastRun();

  if (!data) {
    return res.status(200).json({
      message: "No runs recorded yet.",
    });
  }

  res.status(200).json(data);
}
