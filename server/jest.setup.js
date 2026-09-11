// Unit tests must run against the deterministic AI engine, never the live
// Gemini API — clear any key that a local .env may have set before modules load.
process.env.GEMINI_API_KEY = "";
process.env.NODE_ENV = "test";
process.env.SSLCOMMERZ_STORE_ID = "";
process.env.SSLCOMMERZ_STORE_PASSWORD = "";
