import app from "../server/index.ts";

export default function handler(req, res) {
  return app(req, res);
}
