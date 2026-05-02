export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class MetaGraphError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "MetaGraphError";
    this.status = status;
    this.body = body;
  }
}

type GraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function extractGraphMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const e = (body as GraphErrorBody).error;
    if (e?.message) {
      const code = e.code != null ? ` (code ${e.code})` : "";
      return `${e.message}${code}`;
    }
  }
  return fallback;
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function graphGet<T = unknown>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { method: "GET" });
  const body = await parse(res);
  if (!res.ok) {
    throw new MetaGraphError(
      extractGraphMessage(body, `Graph GET ${path} failed: ${res.status}`),
      res.status,
      body,
    );
  }
  return body as T;
}

export async function graphPost<T = unknown>(
  path: string,
  body: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = `${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    form.set(k, String(v));
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const respBody = await parse(res);
  if (!res.ok) {
    throw new MetaGraphError(
      extractGraphMessage(respBody, `Graph POST ${path} failed: ${res.status}`),
      res.status,
      respBody,
    );
  }
  return respBody as T;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
