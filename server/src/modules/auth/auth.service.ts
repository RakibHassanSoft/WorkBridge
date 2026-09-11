import { Role } from "@prisma/client";
import { userService } from "@/modules/user/user.service";
import { PublicUser } from "@/modules/user/user.model";
import { hashPassword, comparePassword } from "@/utils/password";
import { signToken } from "@/utils/jwt";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";
import type { RegisterInput, LoginInput } from "./auth.validator";

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    // Moderator accounts are privileged — gate them behind a server-side code.
    if (input.role === Role.MODERATOR) {
      if (!env.moderatorSignupCode) {
        throw AppError.forbidden("Moderator registration is disabled");
      }
      if (input.moderatorCode !== env.moderatorSignupCode) {
        throw AppError.forbidden("Invalid moderator code");
      }
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userService.createWithProfile(
      {
        email: input.email,
        password: passwordHash,
        role: input.role,
        name: input.name,
        phone: input.phone,
      },
      input.role === Role.CLIENT
        ? {
            client: {
              businessName: input.businessName,
              industry: input.industry,
              size: input.size,
              city: input.city,
            },
          }
        : input.role === Role.STUDENT
          ? {
              student: {
                university: input.university,
                discipline: input.discipline,
                year: input.year,
                city: input.city,
                skills: input.skills,
                bio: input.bio,
              },
            }
          : undefined
    );

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    return { user, token };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const record = await userService.findByEmailWithSecret(input.email);
    if (!record) throw AppError.unauthorized("Invalid email or password");
    if (!record.isActive) throw AppError.forbidden("This account is disabled");

    const ok = await comparePassword(input.password, record.password);
    if (!ok) throw AppError.unauthorized("Invalid email or password");

    const token = signToken({
      sub: record.id,
      role: record.role,
      email: record.email,
    });

    const { password: _pw, ...user } = record;
    return { user: user as PublicUser, token };
  },
};

export type AuthService = typeof authService;
