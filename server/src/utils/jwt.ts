import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "@/config/env";
import { Role } from "@prisma/client";

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwtSecret) as JwtPayload;
