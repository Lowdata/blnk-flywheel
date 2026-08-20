import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Runs the /api serverless functions inside the Vite dev server.
 *
 *  Without this, `npm run dev` serves only the SPA and every /api call 404s,
 *  so anything needing a server-side secret — the OpenSea key, the database —
 *  is untestable until deploy. This adapts Node's req/res to the shape the
 *  Vercel handlers expect and routes /api/<name> to api/<name>.ts.
 *
 *  Dev only. In production Vercel runs these functions itself.
 */
export function apiPlugin(): Plugin {
  return {
    name: "blnk-api-dev",
    apply: "serve",

    configResolved(config) {
      // Server-side secrets live in .env.local without a VITE_ prefix, so Vite
      // deliberately keeps them out of import.meta.env. The handlers read
      // process.env, so load them there instead — this never reaches the client.
      const env = loadEnv(config.mode, config.root, "");
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith("VITE_") && process.env[key] === undefined) process.env[key] = value;
      }
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) return next();

        const parsed = new URL(url, "http://localhost");
        const name = parsed.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
        const file = resolve(server.config.root, "api", `${name}.ts`);

        // Routes are the flat .ts files directly under api/. `_lib` is shared
        // code with no default export — Vercel won't serve it, so neither do we,
        // rather than loading it and failing on a missing handler.
        if (!/^[a-zA-Z0-9-]+$/.test(name) || !existsSync(file)) return next();

        try {
          const body = await readBody(req);
          const mod = await server.ssrLoadModule(file);
          const handler = mod.default;

          // Vercel hands the handler parsed query/body and an express-like res.
          const vercelReq = Object.assign(req, {
            query: Object.fromEntries(parsed.searchParams),
            body,
          });

          const vercelRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vercelRes;
            },
            json(payload: unknown) {
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(payload));
              return vercelRes;
            },
            send(payload: string) {
              res.end(payload);
              return vercelRes;
            },
          });

          await handler(vercelReq, vercelRes);
        } catch (error) {
          server.config.logger.error(`[api] ${name} failed: ${String(error)}`);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "Internal error" }));
          }
        }
      });
    },
  };
}

async function readBody(req: { on: Function; method?: string }): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  await new Promise<void>((done, fail) => {
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => done());
    req.on("error", fail);
  });
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}
