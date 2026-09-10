import { Request, Response } from "express";
import { DisputeStatus, Role, TicketStatus } from "@prisma/client";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { moderatorService } from "./moderator.service";

export const moderatorController = {
  // Scope review
  listScopes: catchAsync(async (_req, res: Response) => {
    sendSuccess(res, 200, "Scopes awaiting review", await moderatorService.listScopes());
  }),
  approveScope: catchAsync(async (req: Request, res: Response) => {
    const job = await moderatorService.approveScope(req.params.jobId, req.body);
    sendSuccess(res, 200, "Scope released", job);
  }),
  rejectScope: catchAsync(async (req: Request, res: Response) => {
    const r = await moderatorService.rejectScope(req.params.jobId, req.body.reason);
    sendSuccess(res, 200, "Scope rejected", r);
  }),

  // Selection
  listSelectRounds: catchAsync(async (_req, res: Response) => {
    sendSuccess(res, 200, "Trial rounds awaiting selection", await moderatorService.listSelectRounds());
  }),
  selectStudent: catchAsync(async (req: Request, res: Response) => {
    const r = await moderatorService.selectStudent(
      req.params.taskId,
      req.body.studentId,
      req.body.reason
    );
    sendSuccess(res, 200, "Student put forward; chat opened", r);
  }),

  // Scoring
  listReviews: catchAsync(async (_req, res: Response) => {
    sendSuccess(res, 200, "Work awaiting scoring", await moderatorService.listReviews());
  }),
  scoreWork: catchAsync(async (req: Request, res: Response) => {
    const e = await moderatorService.scoreWork(req.user!.sub, req.params.taskId, req.body);
    sendSuccess(res, 200, "Work scored", e);
  }),

  // KYC
  listKyc: catchAsync(async (_req, res: Response) => {
    sendSuccess(res, 200, "Verifications pending", await moderatorService.listKyc());
  }),
  decideKyc: catchAsync(async (req: Request, res: Response) => {
    const r = await moderatorService.decideKyc(req.params.id, req.body);
    sendSuccess(res, 200, "Verification updated", r);
  }),

  // Payments
  listPayments: catchAsync(async (_req, res: Response) => {
    sendSuccess(res, 200, "Payment ledger", await moderatorService.listPayments());
  }),
  refund: catchAsync(async (req: Request, res: Response) => {
    const p = await moderatorService.refund(req.params.taskId, req.body.reason);
    sendSuccess(res, 200, "Escrow refunded", p);
  }),

  // Disputes
  listDisputes: catchAsync(async (req: Request, res: Response) => {
    const status = req.query.status as DisputeStatus | undefined;
    sendSuccess(res, 200, "Disputes", await moderatorService.listDisputes(status));
  }),
  ruleDispute: catchAsync(async (req: Request, res: Response) => {
    const r = await moderatorService.ruleDispute(req.params.id, req.body);
    sendSuccess(res, 200, "Dispute resolved", r);
  }),

  // Support
  listTickets: catchAsync(async (req: Request, res: Response) => {
    const status = req.query.status as TicketStatus | undefined;
    sendSuccess(res, 200, "Support tickets", await moderatorService.listTickets(status));
  }),
  replyTicket: catchAsync(async (req: Request, res: Response) => {
    const t = await moderatorService.replyTicket(req.params.id, req.body.reply);
    sendSuccess(res, 200, "Reply sent", t);
  }),

  // Directory
  listUsers: catchAsync(async (req: Request, res: Response) => {
    const role = req.query.role as Role | undefined;
    sendSuccess(res, 200, "Users", await moderatorService.listUsers({ role }));
  }),
  setUserActive: catchAsync(async (req: Request, res: Response) => {
    const u = await moderatorService.setUserActive(req.params.id, req.body.isActive);
    sendSuccess(res, 200, "Account updated", u);
  }),

  // Controls
  controls: catchAsync(async (_req, res: Response) => {
    sendSuccess(res, 200, "Platform controls", moderatorService.controls());
  }),
};
