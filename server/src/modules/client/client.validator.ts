import { z } from "zod";

const taskIdParam = z.object({ taskId: z.string().min(1) });

// Uploaded files (metadata + extracted text) a client attaches to a brief.
const uploadedFile = z.object({
  name: z.string().min(1).max(400),
  mime: z.string().max(200),
  size: z.number().int().nonnegative(),
  content: z.string().max(200000).nullable().optional(),
  // base64 of an image/PDF for the AI judge to look at (stripped before storing)
  data: z.string().max(16_000_000).nullable().optional(),
});
export const attachmentsSchema = z
  .array(z.object({ kind: z.enum(["file", "folder"]), name: z.string().min(1).max(400), files: z.array(uploadedFile).max(500) }))
  .max(50)
  .optional();

export const postJobSchema = z.object({
  body: z.object({
    brief: z.string().min(10, "Describe the problem in a sentence or two"),
    title: z.string().max(160).optional(),
    budget: z.number().int().positive().optional(),
    attachments: attachmentsSchema,
  }),
});

export const jobIdParam = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const reviewTrialSchema = z.object({
  params: taskIdParam,
  body: z.object({
    decision: z.enum(["approve", "changes"]),
    note: z.string().max(1000).optional(),
  }),
});

export const depositSchema = z.object({
  params: taskIdParam,
  body: z.object({
    paymentMethodId: z.string().optional(),
  }),
});

export const signOffSchema = z.object({
  params: taskIdParam,
  body: z.object({
    decision: z.enum(["accept", "revision"]),
    note: z.string().max(1000).optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: taskIdParam,
  body: z.object({
    title: z.string().max(160).optional(),
    brief: z.string().min(10, "Describe the problem in a sentence or two").max(20000).optional(),
    budget: z.number().int().positive().optional(),
    hours: z.number().int().positive().max(400).optional(),
  }),
});

export const cancelTaskSchema = z.object({ params: taskIdParam });

export const disputeSchema = z.object({
  params: taskIdParam,
  body: z.object({
    claim: z.string().min(5, "Explain the problem"),
    amount: z.number().int().nonnegative(),
    evidence: z.array(z.string()).optional(),
  }),
});

export const chatPostSchema = z.object({
  params: taskIdParam,
  body: z.object({
    body: z.string().min(1, "Message cannot be empty").max(4000),
    attachment: z.string().optional(),
  }),
});

export const chatListSchema = z.object({ params: taskIdParam });

export const paymentMethodSchema = z.object({
  body: z.object({
    kind: z.enum(["bkash", "nagad", "bank", "card"]),
    label: z.string().min(2),
    isDefault: z.boolean().optional(),
  }),
});
