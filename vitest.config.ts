import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for the frontend logic: the AI judge + trial builder, the scoping
// engine, the in-browser demo backend (the whole live-demo flow) and uploads.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
