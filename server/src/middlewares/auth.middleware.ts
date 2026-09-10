import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { verifyToken, JwtPayload } from "@/utils/jwt";
import { AppError } from "@/utils/AppError";

// Augment Express Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Requires a valid Bearer token; attaches req.user. */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or malformed Authorization header"));
  }
  const token = header.slice(7).trim();
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired token"));
  }
};

/** Requires the authenticated user to have one of the given roles. */
export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `This action requires role: ${roles.join(" or ")}`
        )
      );
    }
    next();
  };
