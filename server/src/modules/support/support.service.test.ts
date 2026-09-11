import { TicketPriority, TicketStatus } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: { supportTicket: { create: jest.fn(), findMany: jest.fn() } },
}));

import prisma from "@/config/prisma";
import { supportService } from "./support.service";

const db = prisma as any;

describe("supportService", () => {
  it("creates a NEW ticket with a ref and maps priority", async () => {
    db.supportTicket.create.mockImplementation(({ data }: any) => data);
    const hi = await supportService.create("u1", { subject: "Payout", body: "Where is my payout?", priority: "high" });
    expect(hi.ref).toMatch(/^TKT-/);
    expect(hi.status).toBe(TicketStatus.NEW);
    expect(hi.priority).toBe(TicketPriority.HIGH);
    const normal = await supportService.create("u1", { subject: "Hi", body: "A question" });
    expect(normal.priority).toBe(TicketPriority.NORMAL);
  });

  it("lists only my tickets, newest first", async () => {
    db.supportTicket.findMany.mockResolvedValue([]);
    await supportService.listMine("u1");
    expect(db.supportTicket.findMany).toHaveBeenCalledWith({ where: { fromId: "u1" }, orderBy: { createdAt: "desc" } });
  });
});
