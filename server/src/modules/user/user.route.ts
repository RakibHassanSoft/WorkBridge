import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { userController } from "./user.controller";
import { userIdParam } from "./user.validator";

const router = Router();

router.get("/me", authenticate, userController.me);
router.get("/:id", authenticate, validate(userIdParam), userController.getById);

export default router;
