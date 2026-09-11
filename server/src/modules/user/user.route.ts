import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { userController } from "./user.controller";
import { userIdParam, setAvatarSchema } from "./user.validator";

const router = Router();

router.get("/me", authenticate, userController.me);
router.patch("/me/avatar", authenticate, validate(setAvatarSchema), userController.setAvatar);
router.get("/:id", authenticate, validate(userIdParam), userController.getById);

export default router;
