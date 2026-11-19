import { incr } from "../redis";
/** Fixed-window limiter. `count` lets callers react once (e.g. warn on the first blocked hit). */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const count = await incr(`rl:${key}`, windowSec);
  return { ok: count <= limit, count, remaining: Math.max(0, limit - count) };
}
