import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HttpError } from "./db";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

/** Shared wrapper: CORS, method guard, and one place that turns thrown
 *  HttpErrors into status codes instead of 500s. */
export function route(methods: string[], handler: Handler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Methods", [...methods, "OPTIONS"].join(", "));

    if (req.method === "OPTIONS") return res.status(204).end();
    if (!methods.includes(req.method ?? "")) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error("Unhandled API error:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  };
}
