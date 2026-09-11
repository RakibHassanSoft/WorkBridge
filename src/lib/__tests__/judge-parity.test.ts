import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// The demo and the API must judge an upload identically: the two copies of the judge are one file.
describe("AI judge copies", () => {
  const front = join(process.cwd(), "src/lib/judge.ts");
  const back = join(process.cwd(), "server/src/modules/ai/ai.judge.ts");
  it.skipIf(!existsSync(back))("src/lib/judge.ts is identical to server/src/modules/ai/ai.judge.ts", () => {
    expect(readFileSync(front, "utf8")).toBe(readFileSync(back, "utf8"));
  });
});
