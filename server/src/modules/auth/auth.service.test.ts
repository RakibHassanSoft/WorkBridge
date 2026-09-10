import { Role } from "@prisma/client";

jest.mock("@/modules/user/user.service", () => ({
  userService: {
    createWithProfile: jest.fn(),
    findByEmailWithSecret: jest.fn(),
  },
}));
jest.mock("@/utils/password", () => ({
  hashPassword: jest.fn(async () => "hashed"),
  comparePassword: jest.fn(),
}));
jest.mock("@/utils/jwt", () => ({
  signToken: jest.fn(() => "signed.jwt.token"),
}));

import { authService } from "./auth.service";
import { userService } from "@/modules/user/user.service";
import { comparePassword } from "@/utils/password";

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockCompare = comparePassword as jest.Mock;

describe("authService", () => {
  describe("register", () => {
    it("hashes the password and returns a user + token for a client", async () => {
      mockUserService.createWithProfile.mockResolvedValue({
        id: "u1",
        email: "c@b.com",
        role: Role.CLIENT,
      } as any);

      const result = await authService.register({
        email: "c@b.com",
        password: "supersecret",
        name: "Client",
        role: Role.CLIENT,
        businessName: "Nokshi",
      } as any);

      expect(result.token).toBe("signed.jwt.token");
      expect(result.user.id).toBe("u1");
      // client branch forwards the businessName to the profile
      const call = mockUserService.createWithProfile.mock.calls[0];
      expect(call[1]?.client?.businessName).toBe("Nokshi");
      expect(call[0].password).toBe("hashed");
    });

    it("passes student fields through on student registration", async () => {
      mockUserService.createWithProfile.mockResolvedValue({
        id: "u2",
        email: "s@b.com",
        role: Role.STUDENT,
      } as any);

      await authService.register({
        email: "s@b.com",
        password: "supersecret",
        name: "Stu",
        role: Role.STUDENT,
        university: "DU",
      } as any);

      const call = mockUserService.createWithProfile.mock.calls[0];
      expect(call[1]?.student?.university).toBe("DU");
    });
  });

  describe("login", () => {
    it("returns a token on correct credentials, without the password", async () => {
      mockUserService.findByEmailWithSecret.mockResolvedValue({
        id: "u1",
        email: "c@b.com",
        role: Role.CLIENT,
        password: "hashed",
        isActive: true,
      } as any);
      mockCompare.mockResolvedValue(true);

      const result = await authService.login({
        email: "c@b.com",
        password: "supersecret",
      });

      expect(result.token).toBe("signed.jwt.token");
      expect((result.user as any).password).toBeUndefined();
    });

    it("rejects an unknown email with 401", async () => {
      mockUserService.findByEmailWithSecret.mockResolvedValue(null);
      await expect(
        authService.login({ email: "none@b.com", password: "x" })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("rejects a wrong password with 401", async () => {
      mockUserService.findByEmailWithSecret.mockResolvedValue({
        id: "u1",
        email: "c@b.com",
        role: Role.CLIENT,
        password: "hashed",
        isActive: true,
      } as any);
      mockCompare.mockResolvedValue(false);
      await expect(
        authService.login({ email: "c@b.com", password: "wrong" })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("rejects a disabled account with 403", async () => {
      mockUserService.findByEmailWithSecret.mockResolvedValue({
        id: "u1",
        email: "c@b.com",
        role: Role.CLIENT,
        password: "hashed",
        isActive: false,
      } as any);
      await expect(
        authService.login({ email: "c@b.com", password: "supersecret" })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
