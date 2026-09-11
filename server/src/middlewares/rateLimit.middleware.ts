import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

// Disabled during tests so the suite isn't throttled.
const skip = () => env.isTest;

/** Global limiter — a sane ceiling on requests per IP. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { success: false, message: "Too many requests, please slow down" },
});

/** Stricter limiter for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { success: false, message: "Too many attempts, please try again later" },
});
