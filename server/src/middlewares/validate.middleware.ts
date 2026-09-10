import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/**
 * Validates and coerces req.body / req.query / req.params against a zod schema
 * shaped as { body?, query?, params? }. Parsed values replace the originals.
 */
export const validate =
  (schema: Schema) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      const p = parsed as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
      if (p.body !== undefined) req.body = p.body;
      if (p.query !== undefined)
        Object.assign(req.query as object, p.query as object);
      if (p.params !== undefined)
        Object.assign(req.params as object, p.params as object);
      next();
    } catch (err) {
      next(err);
    }
  };
