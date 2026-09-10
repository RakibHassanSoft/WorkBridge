import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { studentController } from "./student.controller";
import {
  updateProfileSchema,
  submitKycSchema,
  browseSchema,
  taskIdParamSchema,
  applySchema,
  progressSchema,
  submitWorkSchema,
  disputeSchema,
  chatListSchema,
  chatPostSchema,
} from "./student.validator";

const router = Router();

router.use(authenticate, authorize(Role.STUDENT));

// Profile & verification
router.get("/profile", studentController.getProfile);
router.patch("/profile", validate(updateProfileSchema), studentController.updateProfile);
router.get("/kyc", studentController.myKyc);
router.post("/kyc", validate(submitKycSchema), studentController.submitKyc);

// Board & apply
router.get("/tasks", validate(browseSchema), studentController.browse);
router.get("/tasks/:taskId", validate(taskIdParamSchema), studentController.taskDetail);
router.post("/tasks/:taskId/apply", validate(applySchema), studentController.apply);

// Trials & points
router.get("/trials", studentController.listTrials);
router.get("/points", studentController.points);

// Active task
router.get("/active", studentController.listActive);
router.post("/tasks/:taskId/progress", validate(progressSchema), studentController.reportProgress);
router.post("/tasks/:taskId/submit", validate(submitWorkSchema), studentController.submitWork);

// Record & earnings
router.get("/record", studentController.record);
router.get("/earnings", studentController.earnings);

// Dispute & chat
router.post("/tasks/:taskId/dispute", validate(disputeSchema), studentController.raiseDispute);
router.get("/tasks/:taskId/messages", validate(chatListSchema), studentController.listMessages);
router.post("/tasks/:taskId/messages", validate(chatPostSchema), studentController.postMessage);

export default router;
