// Gemini client: request shape, images sent inline, retries, and a clean null on any failure.
jest.mock("@/config/env", () => ({
  env: { geminiApiKey: "test-key", geminiModel: "gemini-test-flash" },
}));

import { geminiScope, geminiJudgeAttempt, geminiRebuildTrial, geminiEnabled } from "./ai.gemini";

const reply = (obj: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => ({ candidates: [{ content: { parts: [{ text: typeof obj === "string" ? obj : JSON.stringify(obj) }] } }] }),
});

let fetchMock: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn();
  (global as any).fetch = fetchMock;
});

const judgeInput = {
  trialTitle: "Trial",
  trialBrief: "Do the thing",
  requirements: ["Produce the A6 label", "Flag the unclear point instead of guessing: two prices", "Upload the files you produced (not only a description)"],
  trialMinutes: 40,
  summary: "Done — which price is right?",
  minutesTaken: 30,
  attachments: [
    { kind: "file" as const, name: "label.png", files: [{ name: "label.png", mime: "image/png", size: 3000, content: null, data: "QUJD" }] },
    { kind: "file" as const, name: "notes.md", files: [{ name: "notes.md", mime: "text/markdown", size: 20, content: "Prices sit in a layer" }] },
  ],
};

describe("ai.gemini", () => {
  it("is enabled when a key is configured", () => {
    expect(geminiEnabled()).toBe(true);
  });

  it("judge: sends text files in the prompt and images as inline data to the configured model", async () => {
    fetchMock.mockResolvedValue(reply({ checklist: [{ status: "met", evidence: "a" }, { status: "met", evidence: "b" }, { status: "met", evidence: "c" }], quality: 80, verdict: "v", coaching: "c", flags: [] }));
    const out = await geminiJudgeAttempt(judgeInput);
    expect(out?.checklist).toHaveLength(3);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/models\/gemini-test-flash:generateContent$/);
    expect(init.headers["x-goog-api-key"]).toBe("test-key");
    const parts = JSON.parse(init.body).contents[0].parts;
    expect(parts[0].text).toMatch(/Prices sit in a layer/); // text file content is in the prompt
    expect(parts[0].text).toMatch(/1\. Produce the A6 label/); // requirements are numbered
    expect(parts.some((p: any) => p.inline_data?.mime_type === "image/png" && p.inline_data.data === "QUJD")).toBe(true);
  });

  it("judge: reads a ```json fenced reply", async () => {
    fetchMock.mockResolvedValue(reply("```json\n" + JSON.stringify({ checklist: [{ status: "partial", evidence: "x" }], quality: 50, verdict: "v", coaching: "c", flags: [] }) + "\n```"));
    const out = await geminiJudgeAttempt(judgeInput);
    expect(out?.checklist[0].status).toBe("partial");
  });

  it("judge: retries once on a 5xx / 429, then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(reply({}, 503))
      .mockResolvedValueOnce(reply({ checklist: [{ status: "met", evidence: "a" }], quality: 70, verdict: "v", coaching: "c", flags: [] }));
    const out = await geminiJudgeAttempt(judgeInput);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out?.quality).toBe(70);
  });

  it("judge: gives up with null on a 4xx (no pointless retry)", async () => {
    fetchMock.mockResolvedValue(reply({}, 404));
    expect(await geminiJudgeAttempt(judgeInput)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("judge: null on bad JSON, network error, or an empty checklist", async () => {
    fetchMock.mockResolvedValue(reply("not json"));
    expect(await geminiJudgeAttempt(judgeInput)).toBeNull();
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(await geminiJudgeAttempt(judgeInput)).toBeNull();
    fetchMock.mockResolvedValue(reply({ checklist: [], quality: 90 }));
    expect(await geminiJudgeAttempt(judgeInput)).toBeNull();
  });

  it("scope: rejects an unknown sector and always ends the trial with flag + upload requirements", async () => {
    fetchMock.mockResolvedValueOnce(reply({ sectorId: "space", title: "t" }));
    expect(await geminiScope("brief")).toBeNull();

    fetchMock.mockResolvedValueOnce(
      reply({ sectorId: "it", title: "Fix checkout", trial: { title: "Trial", brief: "Reproduce", minutes: 40, requirements: ["Reproduce the failure", "Upload stuff"] } })
    );
    const out = await geminiScope("checkout fails");
    const reqs = out?.trialPlan?.requirements ?? [];
    expect(reqs.some((r) => /^Flag the unclear point/.test(r))).toBe(true);
    expect(reqs[reqs.length - 1]).toBe("Upload the files you produced (not only a description)");
    expect(reqs.filter((r) => /^upload/i.test(r))).toHaveLength(1);
  });

  it("rebuild: puts the client's note in the prompt", async () => {
    fetchMock.mockResolvedValue(reply({ title: "T2", brief: "B2", minutes: 30, requirements: ["Use the Eid range", "Flag the unclear point instead of guessing: x"] }));
    const t = await geminiRebuildTrial({ brief: "b", sectorName: "Design", hours: 8, current: { title: "t", brief: "b", requirements: ["r"] }, note: "Use the Eid range" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts[0].text).toMatch(/Use the Eid range/);
    expect(t?.title).toBe("T2");
  });
});
