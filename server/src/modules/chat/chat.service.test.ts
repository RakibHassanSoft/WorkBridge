import { Role } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    task: { findUnique: jest.fn() },
    chatMessage: { findMany: jest.fn(), create: jest.fn() },
  },
}));

import prisma from "@/config/prisma";
import { chatService } from "./chat.service";

const db = prisma as any;
const task = { id: "t1", assigneeId: "s1", job: { clientId: "c1" } };

describe("chatService", () => {
  it("lets the task's client, assigned student and any moderator in", async () => {
    db.task.findUnique.mockResolvedValue(task);
    db.chatMessage.findMany.mockResolvedValue([]);
    await expect(chatService.list("t1", "c1", Role.CLIENT)).resolves.toEqual([]);
    await expect(chatService.list("t1", "s1", Role.STUDENT)).resolves.toEqual([]);
    await expect(chatService.list("t1", "m9", Role.MODERATOR)).resolves.toEqual([]);
  });

  it("keeps other clients and students out", async () => {
    db.task.findUnique.mockResolvedValue(task);
    await expect(chatService.list("t1", "c2", Role.CLIENT)).rejects.toMatchObject({ statusCode: 403 });
    await expect(chatService.list("t1", "s2", Role.STUDENT)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("opens only once a student is assigned (moderators can always post)", async () => {
    db.task.findUnique.mockResolvedValue({ ...task, assigneeId: null });
    await expect(chatService.post("t1", "c1", Role.CLIENT, "hi")).rejects.toMatchObject({ statusCode: 400 });
    db.chatMessage.create.mockImplementation(({ data }: any) => data);
    const m = await chatService.post("t1", "m1", Role.MODERATOR, "note");
    expect(m.fromRole).toBe(Role.MODERATOR);
  });

  it("404s for an unknown task", async () => {
    db.task.findUnique.mockResolvedValue(null);
    await expect(chatService.list("tX", "c1", Role.CLIENT)).rejects.toMatchObject({ statusCode: 404 });
  });
});
