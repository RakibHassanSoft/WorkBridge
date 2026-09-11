import { applySchema, submitWorkSchema } from "./student.validator";
import { postJobSchema } from "@/modules/client/client.validator";

const file = (extra: Record<string, unknown> = {}) => ({ kind: "file", name: "a.png", files: [{ name: "a.png", mime: "image/png", size: 10, content: null, ...extra }] });

describe("upload validation", () => {
  it("accepts a trial with files, including base64 image data for the AI", () => {
    const r = applySchema.safeParse({ params: { taskId: "t1" }, body: { summary: "did the work here", minutesTaken: 30, attachments: [file({ data: "QUJD" })] } });
    expect(r.success).toBe(true);
  });

  it("rejects a too-short summary, zero minutes and absurd durations", () => {
    expect(applySchema.safeParse({ params: { taskId: "t1" }, body: { summary: "hi", minutesTaken: 30 } }).success).toBe(false);
    expect(applySchema.safeParse({ params: { taskId: "t1" }, body: { summary: "did the work", minutesTaken: 0 } }).success).toBe(false);
    expect(applySchema.safeParse({ params: { taskId: "t1" }, body: { summary: "did the work", minutesTaken: 601 } }).success).toBe(false);
  });

  it("rejects a malformed attachment", () => {
    const bad = { kind: "zip", name: "x", files: [] };
    expect(applySchema.safeParse({ params: { taskId: "t1" }, body: { summary: "did the work", minutesTaken: 30, attachments: [bad] } }).success).toBe(false);
  });

  it("caps base64 data size", () => {
    const huge = "A".repeat(16_000_001);
    expect(submitWorkSchema.safeParse({ params: { taskId: "t1" }, body: { note: "done here", files: [file({ data: huge })] } }).success).toBe(false);
  });

  it("client brief: needs 10+ characters, accepts attachments", () => {
    expect(postJobSchema.safeParse({ body: { brief: "too short" } }).success).toBe(false);
    expect(postJobSchema.safeParse({ body: { brief: "Our checkout keeps failing", attachments: [file()] } }).success).toBe(true);
  });
});
