// Simple in-memory rate limiting per client IP (sliding window). Good enough for a single
// server instance; if the app ever runs on several instances, move this to the database or Redis.
import { NextResponse } from "next/server";

type Bucket = number[]; // request timestamps (ms)
const store = globalThis as unknown as { __sfRate?: Map<string, Bucket>; __sfRateSweep?: number };
const buckets = (store.__sfRate ??= new Map());

export const LIMITS = {
  createProfile: { max: 5, windowMs: 60 * 60_000 }, // new profiles per IP per hour
  updateProfile: { max: 30, windowMs: 60 * 60_000 },
  resume: { max: 10, windowMs: 60 * 60_000 }, // resume PDF reads per IP per hour
  discover: { max: 20, windowMs: 60 * 60_000 }, // "Find Startups Today" clicks per IP per hour
  privateLink: { max: 30, windowMs: 60 * 60_000 }, // private-link opens (slows token guessing)
  newLink: { max: 10, windowMs: 60 * 60_000 }, // new private links created
  read: { max: 120, windowMs: 60_000 }, // dashboard/data reads per IP per minute
  write: { max: 60, windowMs: 60_000 }, // saves, status changes, pins per IP per minute
} as const;

export function clientIp(req: Request): string {
  // Render (and most proxies) put the real client first in X-Forwarded-For.
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

/** Returns a 429 response if the client is over the limit, otherwise null (and records the hit). */
export function rateLimit(req: Request, name: keyof typeof LIMITS): NextResponse | null {
  const { max, windowMs } = LIMITS[name];
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (hits.length >= max) {
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    buckets.set(key, hits);
    const wait = retryAfter >= 120 ? `${Math.ceil(retryAfter / 60)} minutes` : `${retryAfter} seconds`;
    return NextResponse.json(
      { error: `Too many requests — please try again in ${wait}.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  hits.push(now);
  buckets.set(key, hits);
  sweep(now);
  return null;
}

/** Drop idle buckets every few minutes so memory doesn't grow. */
function sweep(now: number) {
  if (now - (store.__sfRateSweep ?? 0) < 5 * 60_000) return;
  store.__sfRateSweep = now;
  const longest = Math.max(...Object.values(LIMITS).map((l) => l.windowMs));
  for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > longest) buckets.delete(k);
}
