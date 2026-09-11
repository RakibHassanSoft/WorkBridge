/**
 * Uploaded deliverables — the metadata + extracted text a student attaches to a
 * trial attempt or to submitted work. No binary is stored: text-like files keep
 * their extracted `content` (so the AI can read them), other files keep only
 * their metadata (so structure and completeness can still be judged). A folder
 * upload becomes one Attachment whose `files` are its members.
 *
 * The SAME shape is used by the frontend (src/lib/api.ts), the demo backend
 * (src/lib/demo/server.ts) and the server, so an upload flows unchanged from the
 * browser to whichever backend is answering.
 */

export interface UploadedFile {
  name: string; // file name, or relative path within a folder
  mime: string;
  size: number; // bytes
  content: string | null; // extracted text for text-like files; null for binary
  // Optional base64 of an image/PDF so a vision model can look at it. Used for
  // the evaluation only and stripped before anything is stored (see stripBinary).
  data?: string | null;
}

export interface Attachment {
  kind: "file" | "folder";
  name: string; // the file's name, or the folder's name
  files: UploadedFile[]; // exactly one for a "file"; the members for a "folder"
}

export interface AttachmentSummary {
  attachmentCount: number;
  fileCount: number;
  folderCount: number;
  totalBytes: number;
  textChars: number;
  hasStructure: boolean; // a folder, or more than one file — a real deliverable, not a single note
  names: string[];
  text: string; // all extracted text, concatenated (capped)
}

const TEXT_CAP = 20000; // never feed more than this many chars of extracted text to the judge

/** Roll a set of attachments up into the signals the judge actually uses. */
export function summarizeAttachments(atts?: Attachment[] | null): AttachmentSummary {
  const list = Array.isArray(atts) ? atts : [];
  const names: string[] = [];
  let fileCount = 0;
  let folderCount = 0;
  let totalBytes = 0;
  let text = "";

  for (const a of list) {
    if (a.kind === "folder") folderCount++;
    const files = Array.isArray(a.files) ? a.files : [];
    for (const f of files) {
      fileCount++;
      totalBytes += Number(f.size) || 0;
      names.push(f.name);
      if (f.content && text.length < TEXT_CAP) {
        text += (text ? "\n\n" : "") + `# ${f.name}\n${f.content}`;
      }
    }
  }

  if (text.length > TEXT_CAP) text = text.slice(0, TEXT_CAP);

  return {
    attachmentCount: list.length,
    fileCount,
    folderCount,
    totalBytes,
    textChars: text.length,
    hasStructure: folderCount > 0 || fileCount > 1,
    names,
    text,
  };
}

/**
 * Score the uploaded deliverable on its own, 0..5, and say why. This is the
 * "file structure & completeness" signal the trial evaluation folds in:
 *   - nothing uploaded  -> 1 (only a written summary)
 *   - files, no readable text (all binary) -> 3 (something delivered, can't read)
 *   - readable text  -> 4, and 5 with real structure or substance, or when the
 *     content clearly addresses the acceptance criteria.
 */
export function scoreAttachments(
  summary: AttachmentSummary,
  acceptance: string[] = []
): { score: number; note: string } {
  if (summary.fileCount === 0) {
    return { score: 1, note: "No files uploaded — judged on the written summary alone." };
  }
  if (summary.textChars === 0) {
    return {
      score: 3,
      note: `${summary.fileCount} file${summary.fileCount === 1 ? "" : "s"} uploaded, but none are readable as text, so only structure could be checked.`,
    };
  }

  // How much of the acceptance criteria is even mentioned in what they delivered?
  const hay = summary.text.toLowerCase();
  const terms = acceptance
    .flatMap((a) => a.toLowerCase().split(/[^a-z0-9]+/))
    .filter((w) => w.length >= 5);
  const hits = new Set(terms.filter((w) => hay.includes(w)));
  const coverage = terms.length ? hits.size / new Set(terms).size : 0;

  let score = 4;
  if (summary.hasStructure || summary.textChars > 400 || coverage >= 0.4) score = 5;

  const bits = [`${summary.fileCount} file${summary.fileCount === 1 ? "" : "s"}`];
  if (summary.folderCount) bits.push(`${summary.folderCount} folder${summary.folderCount === 1 ? "" : "s"}`);
  bits.push(`${summary.textChars} chars of readable content`);
  const note =
    `Reviewed the upload (${bits.join(", ")}). ` +
    (coverage >= 0.4
      ? "The deliverable visibly addresses the acceptance criteria."
      : "Cross-check the deliverable against the acceptance criteria before selecting.");

  return { score, note };
}

/** Drop the base64 `data` of every file — it is sent to the judge, never stored. */
export function stripBinary(atts?: Attachment[] | null): Attachment[] | undefined {
  if (!Array.isArray(atts)) return undefined;
  return atts.map((a) => ({
    kind: a.kind,
    name: a.name,
    files: (a.files ?? []).map((f) => ({ name: f.name, mime: f.mime, size: f.size, content: f.content ?? null })),
  }));
}
