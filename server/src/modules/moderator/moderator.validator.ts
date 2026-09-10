import { z } from "zod";

const jobIdParam = z.object({ jobId: z.string().min(1) });
const taskIdParam = z.object({ taskId: z.string().min(1) });

export const approveScopeSchema = z.object({
  params: jobIdParam,
  body: z.object({
    fee: z.number().int().positive().optional(),
    hours: z.number().int().positive().optional(),
    summary: z.string().optional(),
    note: z.string().optional(),
  }),
});

export const rejectScopeSchema = z.object({
  params: jobIdParam,
  body: z.object({ reason: z.string().min(3) }),
});

export const selectStudentSchema = z.object({
  params: taskIdParam,
  body: z.object({
    studentId: z.string().min(1),
    reason: z.string().min(3, "Say why you put this person forward"),
  }),
});

export const scoreWorkSchema = z.object({
  params: taskIdParam,
  body: z.object({
    scores: z
      .array(
        z.object({
          dim: z.string().min(1),
          score: z.number().int().min(0),
          max: z.number().int().positive(),
        })
      )
      .min(1),
    note: z.string().optional(),
  }),
});

export const kycDecisionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    decision: z.enum(["approve", "reject", "resubmit"]),
    note: z.string().optional(),
  }),
});

export const refundSchema = z.object({
  params: taskIdParam,
  body: z.object({ reason: z.string().min(3) }),
});

export const ruleDisputeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    outcome: z.enum(["client", "student", "split"]),
    resolution: z.string().min(3),
  }),
});

export const replyTicketSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ reply: z.string().min(1) }),
});

export const setActiveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ isActive: z.boolean() }),
});

export const listUsersSchema = z.object({
  query: z.object({ role: z.enum(["CLIENT", "STUDENT", "MODERATOR"]).optional() }),
});
