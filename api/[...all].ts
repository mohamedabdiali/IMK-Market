import type { VercelRequest, VercelResponse } from "@vercel/node";

type AppHandler = (req: VercelRequest, res: VercelResponse) => unknown;

let appPromise: Promise<AppHandler> | null = null;

const loadModuleDefault = async (path: string): Promise<AppHandler> => {
  const mod = await import(path);
  const handler = (mod as { default?: AppHandler }).default ?? (mod as unknown as AppHandler);
  return handler;
};

const loadRealApp = async (): Promise<AppHandler> => {
  try {
    return await loadModuleDefault("../server/index.js");
  } catch {
    return await loadModuleDefault("../server/index.ts");
  }
};

const loadMockApp = async (): Promise<AppHandler> => {
  const mod = await import("../server/mock-api-full.cjs");
  return (mod as { default?: AppHandler }).default ?? (mod as unknown as AppHandler);
};

const loadApp = () => {
  if (appPromise) return appPromise;

  const useMock = process.env.USE_MOCK_API === "true" || !process.env.DATABASE_URL;

  appPromise = (async () => {
    if (useMock) {
      return loadMockApp();
    }
    return loadRealApp();
  })();

  return appPromise;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API bootstrap failed:", message);
    return res.status(500).json({ error: "API bootstrap failed", message });
  }
}
