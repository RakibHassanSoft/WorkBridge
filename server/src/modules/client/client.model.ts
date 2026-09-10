import { Prisma, TaskLevel } from "@prisma/client";

/** Map the AI engine's level string to the Prisma enum. */
export function toTaskLevel(level: "micro" | "standard" | "advanced"): TaskLevel {
  return level === "micro"
    ? TaskLevel.MICRO
    : level === "advanced"
      ? TaskLevel.ADVANCED
      : TaskLevel.STANDARD;
}

// Job detail with everything the client workspace shows for a task.
export const jobDetailInclude = {
  sector: true,
  tasks: {
    include: {
      trial: true,
      trialCheck: true,
      payment: true,
      evaluation: true,
      assignee: { select: { id: true, name: true, role: true } },
      attempts: {
        where: { outcome: "SELECTED" as const },
        include: { student: { select: { id: true, name: true } } },
      },
    },
  },
} satisfies Prisma.JobInclude;
