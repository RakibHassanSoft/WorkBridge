/**
 * Turn files a user picks (a set of files, or a whole folder) into the
 * Attachment shape the API and the demo backend both understand.
 *
 * Text is EXTRACTED in the browser so the AI can read the work:
 *   - text-like files (code, CSV, JSON, markdown, …) are read directly
 *   - PDFs are read with pdf.js
 *   - Word .docx files are read with mammoth
 *   - images and PDFs with no extractable text are also sent as base64 so the
 *     AI judge can LOOK at them (capped; the server strips it before storing)
 *   - anything else (binaries) is accepted but kept as metadata only
 * Extraction is best-effort: any failure falls back to metadata so an upload
 * never breaks.
 */
import type { Attachment, UploadedFile } from "./api";

const TEXT_EXT =
  /\.(txt|md|markdown|csv|tsv|json|jsonc|js|jsx|ts|tsx|mjs|cjs|html?|css|scss|xml|yml|yaml|log|py|java|c|cc|cpp|h|hpp|cs|go|rb|php|sql|sh|bash|env|ini|conf|toml|svg|tex|rtf)$/i;

const MAX_FILE_CONTENT = 20000; // chars kept per file
const MAX_TOTAL_CONTENT = 80000; // chars kept across one submission
const MAX_FILES = 100;
const MAX_VISUAL_FILE = 4 * 1024 * 1024; // bytes per image/PDF sent for the AI to see
const MAX_VISUAL_TOTAL = 9 * 1024 * 1024; // bytes across one submission

function isVisual(file: File): boolean {
  return /^image\/(png|jpe?g|webp|heic|heif)$/i.test(file.type) || isPdf(file) || /\.(png|jpe?g|webp|heic)$/i.test(file.name);
}

async function toBase64(file: File): Promise<string | null> {
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < buf.length; i += CHUNK) bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
    return btoa(bin);
  } catch {
    return null;
  }
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}
function isDocx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(file.name)
  );
}
function isTextual(file: File): boolean {
  const t = file.type || "";
  if (t.startsWith("text/")) return true;
  if (/(json|javascript|typescript|xml|csv|yaml|markdown|x-sh|svg)/i.test(t)) return true;
  return TEXT_EXT.test(file.name);
}

function cap(s: string): string {
  return s.length > MAX_FILE_CONTENT ? s.slice(0, MAX_FILE_CONTENT) : s;
}

async function readPlainText(file: File): Promise<string> {
  const slice = file.size > MAX_FILE_CONTENT * 4 ? file.slice(0, MAX_FILE_CONTENT * 4) : file;
  return cap(await slice.text());
}

async function readPdf(file: File): Promise<string> {
  // Loaded on demand so the heavy library is only pulled when a PDF is uploaded.
  const pdfjs = await import("pdfjs-dist");
  try {
    // Bundled worker (Next resolves this URL at build time).
    (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
      new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  } catch {
    /* worker URL not resolvable in this environment — pdf.js falls back */
  }
  const data = await file.arrayBuffer();
  const doc = await (pdfjs as unknown as { getDocument: (o: unknown) => { promise: Promise<PdfDoc> } })
    .getDocument({ data })
    .promise;
  let out = "";
  const pages = Math.min(doc.numPages, 50);
  for (let i = 1; i <= pages && out.length < MAX_FILE_CONTENT; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  return cap(out.trim());
}

interface PdfDoc {
  numPages: number;
  getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: ({ str?: string })[] }> }>;
}

async function readDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const fn = (mammoth as unknown as { extractRawText?: (o: unknown) => Promise<{ value: string }>; default?: { extractRawText: (o: unknown) => Promise<{ value: string }> } });
  const extract = fn.extractRawText ?? fn.default?.extractRawText;
  if (!extract) return "";
  const res = await extract({ arrayBuffer });
  return cap(res.value ?? "");
}

async function extract(file: File, budget: number): Promise<string | null> {
  if (budget <= 0) return null;
  try {
    if (isPdf(file)) return await readPdf(file);
    if (isDocx(file)) return await readDocx(file);
    if (isTextual(file)) return await readPlainText(file);
  } catch {
    return null; // extraction failed — keep metadata only
  }
  return null;
}

/** Convert a FileList (from a file or folder input) into Attachment[]. */
export async function filesToAttachments(input: FileList | File[]): Promise<Attachment[]> {
  const files = Array.from(input).slice(0, MAX_FILES);
  let budget = MAX_TOTAL_CONTENT;

  const folders = new Map<string, UploadedFile[]>();
  const singles: UploadedFile[] = [];
  let visualBudget = MAX_VISUAL_TOTAL;

  for (const f of files) {
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || "";
    const content = await extract(f, budget);
    if (content) budget -= content.length;
    // An image (or a scanned PDF with no text layer) is sent for the AI to look at.
    let data: string | null = null;
    if (!content && isVisual(f) && f.size > 0 && f.size <= MAX_VISUAL_FILE && f.size <= visualBudget) {
      data = await toBase64(f);
      if (data) visualBudget -= f.size;
    }
    const uf: UploadedFile = {
      name: rel || f.name,
      mime: f.type || (isPdf(f) ? "application/pdf" : "application/octet-stream"),
      size: f.size,
      content: content ?? null,
      ...(data ? { data } : {}),
    };
    if (rel && rel.includes("/")) {
      const top = rel.split("/")[0];
      const arr = folders.get(top) ?? [];
      arr.push(uf);
      folders.set(top, arr);
    } else {
      singles.push(uf);
    }
  }

  const out: Attachment[] = [];
  for (const [name, members] of folders) out.push({ kind: "folder", name, files: members });
  for (const uf of singles) out.push({ kind: "file", name: uf.name, files: [uf] });
  return out;
}

export function attachmentFileCount(atts?: Attachment[] | null): number {
  return (atts ?? []).reduce((n, a) => n + (a.files?.length ?? 0), 0);
}
