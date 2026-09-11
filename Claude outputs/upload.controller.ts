import crypto from "crypto";
import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { AppError } from "@/utils/AppError";
import { env, cloudinaryEnabled } from "@/config/env";

/**
 * Cloudinary signed uploads. The browser never sees the API secret: it asks
 * here for a short-lived signature, then uploads the file straight to
 * Cloudinary. When Cloudinary is not configured, this returns 503 and the
 * frontend falls back to inline storage (avatar data URL / extracted text).
 */
const ALLOWED_FOLDERS = new Set(["workbridge/avatars", "workbridge/deliverables"]);

export const uploadController = {
  sign: catchAsync(async (req: Request, res: Response) => {
    if (!cloudinaryEnabled()) {
      throw AppError.badRequest("File storage is not configured");
    }
    const folder = ALLOWED_FOLDERS.has(req.body.folder) ? (req.body.folder as string) : "workbridge/deliverables";
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signs the alphabetically-sorted params the client will send
    // (here: folder + timestamp), concatenated with the API secret.
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(toSign + env.cloudinary.apiSecret)
      .digest("hex");

    sendSuccess(res, 200, "Upload signature", {
      cloudName: env.cloudinary.cloudName,
      apiKey: env.cloudinary.apiKey,
      timestamp,
      signature,
      folder,
    });
  }),
};
