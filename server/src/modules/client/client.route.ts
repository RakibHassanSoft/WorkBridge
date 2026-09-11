import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { clientController } from "./client.controller";
import {
  postJobSchema,
  jobIdParam,
  reviewTrialSchema,
  depositSchema,
  signOffSchema,
  disputeSchema,
  chatPostSchema,
  chatListSchema,
  paymentMethodSchema,
  updateTaskSchema,
  cancelTaskSchema,
} from "./client.validator";

const router = Router();

// Every client route requires an authenticated CLIENT.
router.use(authenticate, authorize(Role.CLIENT));

// Jobs / problems
router.post("/jobs", validate(postJobSchema), clientController.postJob);
router.get("/jobs", clientController.listJobs);
router.get("/jobs/:id", validate(jobIdParam), clientController.getJob);

// Task actions
router.post("/tasks/:taskId/trial-check", validate(reviewTrialSchema), clientController.reviewTrial);
router.post("/tasks/:taskId/deposit", validate(depositSchema), clientController.deposit);
router.post("/tasks/:taskId/signoff", validate(signOffSchema), clientController.signOff);
router.post("/tasks/:taskId/dispute", validate(disputeSchema), clientController.raiseDispute);
router.patch("/tasks/:taskId", validate(updateTaskSchema), clientController.updateTask);
router.post("/tasks/:taskId/cancel", validate(cancelTaskSchema), clientController.cancelTask);

// Chat
router.get("/tasks/:taskId/messages", validate(chatListSchema), clientController.listMessages);
router.post("/tasks/:taskId/messages", validate(chatPostSchema), clientController.postMessage);

// Spend & payment methods
router.get("/payments", clientController.listPayments);
router.get("/payment-methods", clientController.listPaymentMethods);
router.post("/payment-methods", validate(paymentMethodSchema), clientController.addPaymentMethod);

export default router;
