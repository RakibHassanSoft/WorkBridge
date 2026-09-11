import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import { uploadController } from "./upload.controller";

const router = Router();

// Any signed-in user can request an upload signature (avatar or a deliverable).
router.post("/sign", authenticate, uploadController.sign);

export default router;
