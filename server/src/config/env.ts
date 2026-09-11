import dotenv from "dotenv";

// Load .env first, then .env.local as a fallback for any values it didn't set
// (dotenv never overrides an already-set variable). This lets the project run
// from a git-ignored .env.local when a .env has not been created.
dotenv.config();
dotenv.config({ path: ".env.local" });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const isTest = process.env.NODE_ENV === "test";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // In tests the DB is always mocked, so a real URL is not required to run them.
  databaseUrl: required(
    "DATABASE_URL",
    isTest ? "postgresql://localhost:5432/workbridge_test" : undefined
  ),
  jwtSecret: required("JWT_SECRET", isTest ? "test-secret" : "dev-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Code required to self-register as a MODERATOR (public registration otherwise
  // only allows CLIENT/STUDENT). Set a strong value in production.
  moderatorSignupCode: process.env.MODERATOR_SIGNUP_CODE ?? "",
  isTest,

  // Gemini (optional). When unset, the AI layer falls back to the
  // deterministic engine so the app works with no key.
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  // A value that is not a model id (e.g. a label pasted by mistake) would make
  // every call 404 and silently fall back to the engine — use the default then.
  geminiModel: /^gemini-[\w.-]+$/.test(process.env.GEMINI_MODEL ?? "") ? (process.env.GEMINI_MODEL as string) : "gemini-3.6-flash",
};
