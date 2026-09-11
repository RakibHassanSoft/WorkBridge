import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { moderatorController } from "./moderator.controller";
import {
  approveScopeSchema,
  rejectScopeSchema,
  selectStudentSchema,
  scoreWorkSchema,
  kycDecisionSchema,
  refundSchema,
  ruleDisputeSchema,
  replyTicketSchema,
  setActiveSchema,
  listUsersSchema,
  updateTaskSchema,
  cancelTaskSchema,
} from "./moderator.validator";

const router = Router();

router.use(authenticate, authorize(Role.MODERATOR));

// Scope review
router.get("/scopes", moderatorController.listScopes);
router.post("/scopes/:jobId/approve", validate(approveScopeSchema), moderatorController.approveScope);
router.post("/scopes/:jobId/reject", validate(rejectScopeSchema), moderatorController.rejectScope);

// Selection
router.get("/select", moderatorController.listSelectRounds);
router.post("/tasks/:taskId/select", validate(selectStudentSchema), moderatorController.selectStudent);

// Scoring
router.get("/reviews", moderatorController.listReviews);
router.post("/tasks/:taskId/score", validate(scoreWorkSchema), moderatorController.scoreWork);

// KYC
router.get("/kyc", moderatorController.listKyc);
router.post("/kyc/:id", validate(kycDecisionSchema), moderatorController.decideKyc);

// Payments
router.get("/payments", moderatorController.listPayments);
router.post("/tasks/:taskId/refund", validate(refundSchema), moderatorController.refund);

// Modify / cancel a task
router.patch("/tasks/:taskId", validate(updateTaskSchema), moderatorController.updateTask);
router.post("/tasks/:taskId/cancel", validate(cancelTaskSchema), moderatorController.cancelTask);

// Disputes
router.get("/disputes", moderatorController.listDisputes);
router.post("/disputes/:id/rule", validate(ruleDisputeSchema), moderatorController.ruleDispute);

// Support
router.get("/support", moderatorController.listTickets);
router.post("/support/:id/reply", validate(replyTicketSchema), moderatorController.replyTicket);

// Directory
router.get("/users", validate(listUsersSchema), moderatorController.listUsers);
router.post("/users/:id/active", validate(setActiveSchema), moderatorController.setUserActive);

// Controls
router.get("/controls", moderatorController.controls);

export default router;
