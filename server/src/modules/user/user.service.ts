import { Prisma, Role, User } from "@prisma/client";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { CreateUserInput, publicUserSelect, PublicUser } from "./user.model";

/**
 * User service — data access + rules that are about the user record itself.
 * Role-specific profile creation (client/student) is coordinated here so a
 * user and its profile are always created together in one transaction.
 */
export const userService = {
  /** Full record incl. password hash — for auth only. Never returned over HTTP. */
  async findByEmailWithSecret(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async findById(id: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    if (!user) throw AppError.notFound("User not found");
    return user;
  },

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  },

  /**
   * Create a user and, based on role, its matching profile row, atomically.
   * `profile` carries the role-specific fields (business name for a client,
   * university/discipline for a student). Moderators get no profile.
   */
  async createWithProfile(
    input: CreateUserInput,
    profile?: {
      client?: { businessName: string; industry?: string; size?: string; city?: string };
      student?: {
        university?: string;
        discipline?: string;
        year?: string;
        city?: string;
        skills?: string[];
        bio?: string;
      };
    }
  ): Promise<PublicUser> {
    const email = input.email.toLowerCase();

    if (await this.existsByEmail(email)) {
      throw AppError.conflict("Email already registered");
    }
    if (input.role === Role.CLIENT && !profile?.client?.businessName) {
      throw AppError.badRequest("A client must provide a business name");
    }

    const data: Prisma.UserCreateInput = {
      email,
      password: input.password,
      role: input.role,
      name: input.name,
      phone: input.phone,
    };

    if (input.role === Role.CLIENT && profile?.client) {
      data.clientProfile = { create: profile.client };
    }
    if (input.role === Role.STUDENT) {
      data.studentProfile = { create: { ...(profile?.student ?? {}) } };
    }

    return prisma.user.create({ data, select: publicUserSelect });
  },

  setAvatar(id: string, avatarUrl: string): Promise<PublicUser> {
    return prisma.user.update({ where: { id }, data: { avatarUrl }, select: publicUserSelect });
  },

  async setActive(id: string, isActive: boolean): Promise<PublicUser> {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: publicUserSelect,
    });
  },
};

export type UserService = typeof userService;
