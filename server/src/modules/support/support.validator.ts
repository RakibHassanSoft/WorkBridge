import { z } from "zod";

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3),
    body: z.string().min(5),
    priority: z.enum(["high", "normal"]).optional(),
  }),
});
