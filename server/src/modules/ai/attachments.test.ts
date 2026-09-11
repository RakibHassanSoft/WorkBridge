import { summarizeAttachments, stripBinary, Attachment } from "./attachments";

const atts: Attachment[] = [
  { kind: "folder", name: "site", files: [
    { name: "site/index.html", mime: "text/html", size: 40, content: "<h1>Hello</h1>" },
    { name: "site/logo.png", mime: "image/png", size: 5000, content: null, data: "QUJD" },
  ] },
  { kind: "file", name: "notes.md", files: [{ name: "notes.md", mime: "text/markdown", size: 10, content: "notes" }] },
];

describe("attachments", () => {
  it("summarises files, folders, bytes and readable text", () => {
    const s = summarizeAttachments(atts);
    expect(s.fileCount).toBe(3);
    expect(s.folderCount).toBe(1);
    expect(s.totalBytes).toBe(5050);
    expect(s.text).toMatch(/Hello/);
    expect(s.text).toMatch(/notes/);
    expect(s.hasStructure).toBe(true);
  });

  it("copes with nothing uploaded", () => {
    expect(summarizeAttachments(undefined).fileCount).toBe(0);
    expect(summarizeAttachments(null).text).toBe("");
  });

  it("strips base64 image data before storing, keeps everything else", () => {
    const out = stripBinary(atts)!;
    expect(out[0].files[1].data).toBeUndefined();
    expect(out[0].files[1]).toEqual({ name: "site/logo.png", mime: "image/png", size: 5000, content: null });
    expect(out[1].files[0].content).toBe("notes");
    expect(stripBinary(undefined)).toBeUndefined();
  });
});
