import { NextResponse } from "next/server";
import { HttpError } from "./db";

/** Minimal stand-ins for the Vercel function request/response the handlers in
 *  this directory were written against. Keeping the shape lets the ported
 *  handlers stay byte-for-byte identical to the standalone Hub, so fixes can
 *  still move between the two without a rewrite. */
export interface ShimRequest {
  method: string;
  query: Record<string, string | undefined>;
  body: any;
}

export interface ShimResponse {
  status(code: number): ShimResponse;
  json(body: unknown): void;
  end(): void;
}

type Handler = (req: ShimRequest, res: ShimResponse) => Promise<unknown>;

type NextHandler = (request: Request) => Promise<NextResponse>;

/** Shared wrapper: method guard, and one place that turns thrown HttpErrors
 *  into status codes instead of 500s.
 *
 *  CORS headers are gone on purpose — these routes are same-origin now that
 *  the Hub is served from /marketplace in this app, so the preflight the
 *  standalone deployment needed no longer applies. */
export function route(methods: string[], handler: Handler): Record<string, NextHandler> {
  const run: NextHandler = async (request) => {
    if (!methods.includes(request.method)) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    const url = new URL(request.url);
    const query: Record<string, string | undefined> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    let body: any = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.json().catch(() => undefined);
    }

    let statusCode = 200;
    let payload: unknown = undefined;
    let sent = false;

    const res: ShimResponse = {
      status(code) {
        statusCode = code;
        return res;
      },
      json(value) {
        payload = value;
        sent = true;
      },
      end() {
        sent = true;
      },
    };

    try {
      await handler({ method: request.method, query, body }, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("Unhandled API error:", error);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    if (!sent) return new NextResponse(null, { status: statusCode });
    if (payload === undefined) return new NextResponse(null, { status: statusCode });
    return NextResponse.json(payload, { status: statusCode });
  };

  return Object.fromEntries(methods.map((method) => [method, run]));
}
