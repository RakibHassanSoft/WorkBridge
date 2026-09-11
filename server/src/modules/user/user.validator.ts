import { z } from "zod";

export const userIdParam = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const setAvatarSchema = z.object({
  // A compressed data: URL. Capped so a huge image can never be stored.
  body: z.object({ avatarUrl: z.string().min(10).max(2_000_000) }),
});

export const setActiveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ isActive: z.boolean() }),
});
