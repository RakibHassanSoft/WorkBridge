import { z } from "zod";

export const userIdParam = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const setActiveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ isActive: z.boolean() }),
});
