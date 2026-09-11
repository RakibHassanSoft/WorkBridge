import { Prisma, Role, User } from "@prisma/client";

/**
 * "model" file for the user feature: the entity's public shape and the Prisma
 * selection used to strip secrets. Business logic lives in user.service.ts.
 */

// Fields safe to return to clients (never the password hash).
export const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Pick<
  User,
  "id" | "email" | "role" | "name" | "phone" | "avatarUrl" | "isActive" | "createdAt" | "updatedAt"
>;

export interface CreateUserInput {
  email: string;
  password: string; // already hashed by the service
  role: Role;
  name: string;
  phone?: string;
}
