import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Directly pass the request and response to the Express app
    return app(req, res);
}
