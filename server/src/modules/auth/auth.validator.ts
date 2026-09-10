import { z } from "zod";
import { Role } from "@prisma/client";

const password = z.string().min(8, "Password must be at least 8 characters");
const email = z.string().email("A valid email is required");

// Base fields every registration shares.
const baseRegister = {
  email,
  password,
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6).optional(),
};

// Role-discriminated registration: a client must send businessName; a student
// may send university/discipline; a moderator needs nothing extra.
export const registerSchema = z.object({
  body: z.discriminatedUnion("role", [
    z.object({
      ...baseRegister,
      role: z.literal(Role.CLIENT),
      businessName: z.string().min(2, "Business name is required"),
      industry: z.string().optional(),
      size: z.string().optional(),
      city: z.string().optional(),
    }),
    z.object({
      ...baseRegister,
      role: z.literal(Role.STUDENT),
      university: z.string().optional(),
      discipline: z.string().optional(),
      year: z.string().optional(),
      city: z.string().optional(),
      skills: z.array(z.string()).optional(),
      bio: z.string().optional(),
    }),
    z.object({
      ...baseRegister,
      role: z.literal(Role.MODERATOR),
    }),
  ]),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, "Password is required"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
