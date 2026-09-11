import { describe, it, expect } from "vitest";
import { filesToAttachments, attachmentFileCount } from "@/lib/upload";

const mk = (name: string, body: string | Uint8Array<ArrayBuffer>, type: string, rel?: string) => {
  const f = new File([body], name, { type });
  if (rel) Object.defineProperty(f, "webkitRelativePath", { value: rel });
  return f;
};

describe("upload · files → attachments", () => {
  it("reads text files so the AI can judge them", async () => {
    const [a] = await filesToAttachments([mk("rows.csv", "name,phone\nRahim,017", "text/csv")]);
    expect(a.kind).toBe("file");
    expect(a.files[0].content).toMatch(/Rahim/);
    expect(a.files[0].data).toBeUndefined();
  });

  it("sends images as base64 for the AI to look at", async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
    const [a] = await filesToAttachments([mk("poster.png", png, "image/png")]);
    expect(a.files[0].content).toBeNull();
    expect(a.files[0].data).toBe(Buffer.from(png).toString("base64"));
  });

  it("does not send huge images (over 4 MB)", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    const [a] = await filesToAttachments([mk("big.jpg", big, "image/jpeg")]);
    expect(a.files[0].data).toBeUndefined();
    expect(a.files[0].size).toBe(big.length);
  });

  it("groups a folder upload into one attachment", async () => {
    const out = await filesToAttachments([
      mk("index.html", "<h1>x</h1>", "text/html", "site/index.html"),
      mk("app.js", "const a=1", "text/javascript", "site/js/app.js"),
      mk("notes.md", "hello", "text/markdown"),
    ]);
    const folder = out.find((a) => a.kind === "folder")!;
    expect(folder.name).toBe("site");
    expect(folder.files.map((f) => f.name)).toEqual(["site/index.html", "site/js/app.js"]);
    expect(attachmentFileCount(out)).toBe(3);
  });

  it("keeps binaries as metadata only", async () => {
    const [a] = await filesToAttachments([mk("model.bin", new Uint8Array([1, 2, 3]), "application/octet-stream")]);
    expect(a.files[0]).toMatchObject({ name: "model.bin", size: 3, content: null });
  });
});
