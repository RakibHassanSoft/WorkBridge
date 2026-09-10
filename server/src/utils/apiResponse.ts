import { Response } from "express";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
}

/** Uniform success envelope: { success, message, data, meta? }. */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: ApiMeta
) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  });
}
