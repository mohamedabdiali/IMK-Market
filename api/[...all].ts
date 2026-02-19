import type { VercelRequest, VercelResponse } from "@vercel/node";

type AppHandler = (req: VercelRequest, res: VercelResponse) => unknown;

let appPromise: Promise<AppHandler> | null = null;

const loadApp = () => {
  if (appPromise) return appPromise;

  const useMock = process.env.USE_MOCK_API === "true" || !process.env.DATABASE_URL;

  appPromise = (async () => {
    if (useMock) {
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      return require("../server/mock-api-full.cjs") as AppHandler;
    }
    const mod = await import("../server/index.js");
    return mod.default as AppHandler;
  })();

  return appPromise;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await loadApp();
  return app(req, res);
}
