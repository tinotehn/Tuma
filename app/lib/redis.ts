import { Redis } from "@upstash/redis";

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function isRateLimited(phone: string, limitSec = 30): Promise<boolean> {
    // FIXED: Used backticks instead of single quotes for variable interpolation
    const key = `tuma:rl:${phone}`;
    
    // FIXED: Changed 'exist' to 'exists' to match the condition check below
    const exists = await redis.get(key);
    if (exists) return true;
    
    await redis.set(key, 1, { ex: limitSec });
    return false;
}

export async function queueVerifyJob(payload: any): Promise<number> {
    // FIXED: Removed the stray space inside the list key to avoid key fragmentation ("tuma:verify:queue")
    return await redis.lpush("tuma:verify:queue", JSON.stringify(payload));
}