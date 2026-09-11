import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";
import { authLimiter } from "@/middlewares/rateLimit.middleware";
import { authController } from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.validator";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);

export default router;
