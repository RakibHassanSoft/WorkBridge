import { z } from "zod";

const taskIdParam = z.object({ taskId: z.string().min(1) });

export const updateProfileSchema = z.object({
  body: z.object({
    university: z.string().optional(),
    discipline: z.string().optional(),
    year: z.string().optional(),
    city: z.string().optional(),
    skills: z.array(z.string()).optional(),
    bio: z.string().max(2000).optional(),
  }),
});

export const submitKycSchema = z.object({
  body: z.object({
    documents: z
      .array(
        z.object({
          label: z.string().min(1),
          detail: z.string().min(1),
        })
      )
      .min(1, "At least one document is required"),
  }),
});

export const browseSchema = z.object({
  query: z.object({
    sectorId: z.string().optional(),
  }),
});

export const taskIdParamSchema = z.object({ params: taskIdParam });

export const applySchema = z.object({
  params: taskIdParam,
  body: z.object({
    summary: z.string().min(10, "Describe what you produced"),
    minutesTaken: z.number().int().positive().max(600),
  }),
});

export const progressSchema = z.object({
  params: taskIdParam,
  body: z.object({ progress: z.number().int().min(0).max(100) }),
});

export const submitWorkSchema = z.object({
  params: taskIdParam,
  body: z.object({ note: z.string().min(5, "Add a short note on what you delivered") }),
});

export const disputeSchema = z.object({
  params: taskIdParam,
  body: z.object({
    claim: z.string().min(5),
    amount: z.number().int().nonnegative(),
    evidence: z.array(z.string()).optional(),
  }),
});

export const chatListSchema = z.object({ params: taskIdParam });

export const chatPostSchema = z.object({
  params: taskIdParam,
  body: z.object({
    body: z.string().min(1).max(4000),
    attachment: z.string().optional(),
  }),
});
