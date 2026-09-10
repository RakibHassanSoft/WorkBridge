import { Role } from "@prisma/client";

// Mock the Prisma singleton before importing the service.
jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import prisma from "@/config/prisma";
import { userService } from "./user.service";
import { AppError } from "@/utils/AppError";

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

describe("userService", () => {
  describe("findById", () => {
    it("returns the user when found", async () => {
      const user = { id: "u1", email: "a@b.com", role: Role.CLIENT };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(userService.findById("u1")).resolves.toEqual(user);
    });

    it("throws 404 when not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(userService.findById("missing")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("existsByEmail", () => {
    it("lowercases the email and reports existence", async () => {
      mockPrisma.user.count.mockResolvedValue(1);
      await expect(userService.existsByEmail("A@B.com")).resolves.toBe(true);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { email: "a@b.com" },
      });
    });
  });

  describe("createWithProfile", () => {
    it("rejects a duplicate email with 409", async () => {
      mockPrisma.user.count.mockResolvedValue(1);
      await expect(
        userService.createWithProfile({
          email: "dup@b.com",
          password: "hash",
          role: Role.STUDENT,
          name: "Dup",
        })
      ).rejects.toBeInstanceOf(AppError);
    });

    it("requires a business name for a client", async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      await expect(
        userService.createWithProfile({
          email: "c@b.com",
          password: "hash",
          role: Role.CLIENT,
          name: "Client",
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("creates a client with a nested clientProfile", async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.create.mockImplementation(({ data }: any) => ({
        id: "u2",
        email: data.email,
        role: data.role,
        name: data.name,
      }));

      await userService.createWithProfile(
        {
          email: "Shop@B.com",
          password: "hash",
          role: Role.CLIENT,
          name: "Shop",
        },
        { client: { businessName: "Nokshi Threads" } }
      );

      const arg = mockPrisma.user.create.mock.calls[0][0];
      expect(arg.data.email).toBe("shop@b.com");
      expect(arg.data.clientProfile.create.businessName).toBe("Nokshi Threads");
    });

    it("creates a student with a nested studentProfile", async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.create.mockResolvedValue({ id: "u3", role: Role.STUDENT });

      await userService.createWithProfile(
        {
          email: "stu@b.com",
          password: "hash",
          role: Role.STUDENT,
          name: "Stu",
        },
        { student: { university: "DU", skills: ["React"] } }
      );

      const arg = mockPrisma.user.create.mock.calls[0][0];
      expect(arg.data.studentProfile.create.university).toBe("DU");
    });
  });
});
