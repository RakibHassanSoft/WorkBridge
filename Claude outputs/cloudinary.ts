/**
 * Signed browser upload to Cloudinary. The server holds the API secret and
 * hands back a short-lived signature; the file goes straight from the browser
 * to Cloudinary. Everything is best-effort: if storage isn't configured (the
 * sign call fails) or the upload errors, this returns null and the caller falls
 * back to inline storage (avatar data URL / extracted text only). In the demo
 * there is no server, so the sign call fails and the fallback runs — as intended.
 */
import type { Api } from "./api";

export async function signedUpload(api: Api, file: File | Blob, folder: string): Promise<string | null> {
  try {
    const sig = await api.uploads.sign(folder);
    if (!sig?.cloudName) return null;
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { secure_url?: string };
    return data.secure_url ?? null;
  } catch {
    return null;
  }
}
