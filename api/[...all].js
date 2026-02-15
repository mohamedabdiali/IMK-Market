import app from "../server/mock-api-full.cjs";

export default function handler(req, res) {
  return app(req, res);
}
