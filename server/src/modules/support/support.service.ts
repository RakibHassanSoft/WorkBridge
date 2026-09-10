import { TicketPriority, TicketStatus } from "@prisma/client";
import prisma from "@/config/prisma";
import { genRef } from "@/utils/ref";

/** Support tickets: created by clients/students, answered by moderators. */
export const supportService = {
  create(
    fromId: string,
    input: { subject: string; body: string; priority?: "high" | "normal" }
  ) {
    return prisma.supportTicket.create({
      data: {
        ref: genRef("TKT"),
        fromId,
        subject: input.subject,
        body: input.body,
        priority: input.priority === "high" ? TicketPriority.HIGH : TicketPriority.NORMAL,
        status: TicketStatus.NEW,
      },
    });
  },

  listMine(fromId: string) {
    return prisma.supportTicket.findMany({
      where: { fromId },
      orderBy: { createdAt: "desc" },
    });
  },
};

export type SupportService = typeof supportService;
