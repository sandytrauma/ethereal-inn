"use server";

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkRateLimit(identifier: string) {
  // Limit to 3 clicks per hour per user
  const key = `rate_limit:inquiry:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600); // Set expiry to 1 hour
  }

  if (count > 3) {
    return { success: false, message: "Too many requests. Please try again later." };
  }

  return { success: true };
}