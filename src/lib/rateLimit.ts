/**
 * rateLimit.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Redis-backed sliding-window rate limiter (Upstash Redis).
 * Falls back to in-memory store if UPSTASH_REDIS_REST_URL is not configured.
 *
 * SETUP (Upstash — Free tier, serverless-compatible):
 *  1. Go to https://console.upstash.com → Create a Redis database
 *  2. Copy "REST URL" and "REST Token"
 *  3. Add to .env.local:
 *       UPSTASH_REDIS_REST_URL="https://xxxx.upstash.io"
 *       UPSTASH_REDIS_REST_TOKEN="AXxxxx"
 *
 * USAGE
 * ──────
 *  import { rateLimit } from "@/lib/rateLimit";
 *
 *  const limiter = rateLimit({ windowMs: 60_000, max: 5 });
 *
 *  export async function POST(req: Request) {
 *    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
 *    const allowed = await limiter.check(ip);
 *    if (!allowed) {
 *      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *    }
 *  }
 */

import { Redis } from "@upstash/redis";

// ── Redis client (lazy-init, only if env vars are set) ─────────────────────
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
    if (redisClient) return redisClient;
    if (
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
        try {
            redisClient = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
            console.log("✅ Upstash Redis connected for rate limiting");
        } catch (err) {
            console.warn("⚠️ Failed to init Upstash Redis, using in-memory fallback:", err);
        }
    }
    return redisClient;
}

// ── In-memory fallback store ────────────────────────────────────────────────
interface MemEntry { count: number; expiresAt: number; }
const memStore = new Map<string, MemEntry>();

function memCleanup() {
    const now = Date.now();
    for (const [key, entry] of memStore.entries()) {
        if (now >= entry.expiresAt) memStore.delete(key);
    }
}

// ── Rate limiter factory ────────────────────────────────────────────────────
interface RateLimitOptions {
    /** Duration of the window in milliseconds */
    windowMs: number;
    /** Maximum number of requests allowed within the window */
    max: number;
    /** Optional key prefix to avoid namespace collisions (default: "rl") */
    prefix?: string;
}

export function rateLimit({ windowMs, max, prefix = "rl" }: RateLimitOptions) {
    const windowSec = Math.ceil(windowMs / 1000);

    /**
     * Check if the given key is within limits.
     * Returns true when allowed, false when throttled.
     */
    async function check(key: string): Promise<boolean> {
        const redis = getRedis();

        if (redis) {
            try {
                const redisKey = `${prefix}:${key}`;
                // Atomic INCR + EXPIRE using pipeline
                const pipeline = redis.pipeline();
                pipeline.incr(redisKey);
                pipeline.expire(redisKey, windowSec);
                const results = await pipeline.exec();
                const count = results[0] as number;

                if (count === 1) {
                    // First request in window — EXPIRE is set above
                }
                return count <= max;
            } catch (err) {
                console.error("❌ Redis rate limit error, falling back to in-memory:", err);
                // Fall through to in-memory
            }
        }

        // ── In-memory fallback ─────────────────────────────────────────────
        memCleanup();
        const now = Date.now();
        const memoryKey = `${prefix}:${key}`;
        const existing = memStore.get(memoryKey);

        if (!existing || now >= existing.expiresAt) {
            memStore.set(memoryKey, { count: 1, expiresAt: now + windowMs });
            return true;
        }
        if (existing.count >= max) return false;
        existing.count += 1;
        return true;
    }

    /**
     * Returns remaining seconds until the rate-limit window resets for a key.
     */
    async function retryAfter(key: string): Promise<number> {
        const redis = getRedis();

        if (redis) {
            try {
                const ttl = await redis.ttl(`${prefix}:${key}`);
                return ttl > 0 ? ttl : 0;
            } catch {
                // fall through
            }
        }

        const entry = memStore.get(`${prefix}:${key}`);
        if (!entry) return 0;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
    }

    return { check, retryAfter };
}

// ── Pre-configured limiters ────────────────────────────────────────────────────

/** Signup: 5 new accounts per 15 minutes per IP */
export const signupLimiter = rateLimit({ windowMs: 15 * 60_000, max: 5, prefix: "rl:signup" });

/** OTP resend / forgot-password: 3 emails per 10 minutes per email address */
export const otpResendLimiter = rateLimit({ windowMs: 10 * 60_000, max: 3, prefix: "rl:otp-resend" });

/** Forgot-password: 3 requests per 15 minutes per IP */
export const forgotPasswordLimiter = rateLimit({ windowMs: 15 * 60_000, max: 3, prefix: "rl:forgot-pw" });

/** Order placement: 20 orders per 10 minutes per user (bot guard) */
export const orderLimiter = rateLimit({ windowMs: 10 * 60_000, max: 20, prefix: "rl:order" });

/** Phone OTP send: 3 SMS OTPs per 10 minutes per IP (Firebase cost guard) */
export const phoneOtpLimiter = rateLimit({ windowMs: 10 * 60_000, max: 3, prefix: "rl:phone-otp" });
