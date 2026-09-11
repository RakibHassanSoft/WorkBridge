import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { clientService } from "./client.service";
import { chatService } from "@/modules/chat/chat.service";

const uid = (req: Request) => req.user!.sub;

export const clientController = {
  postJob: catchAsync(async (req, res: Response) => {
    const result = await clientService.postJob(uid(req), req.body);
    sendSuccess(res, 201, "Problem posted and scoped", result);
  }),

  listJobs: catchAsync(async (req, res: Response) => {
    const jobs = await clientService.listJobs(uid(req));
    sendSuccess(res, 200, "Your problems", jobs);
  }),

  getJob: catchAsync(async (req: Request, res: Response) => {
    const job = await clientService.getJob(uid(req), req.params.id);
    sendSuccess(res, 200, "Job detail", job);
  }),

  reviewTrial: catchAsync(async (req: Request, res: Response) => {
    const result = await clientService.reviewTrial(
      uid(req),
      req.params.taskId,
      req.body
    );
    sendSuccess(res, 200, "Trial check recorded", result);
  }),

  deposit: catchAsync(async (req: Request, res: Response) => {
    const result = await clientService.depositEscrow(
      uid(req),
      req.params.taskId,
      req.body
    );
    sendSuccess(res, 200, "Deposit held in escrow", result);
  }),

  signOff: catchAsync(async (req: Request, res: Response) => {
    const result = await clientService.signOff(
      uid(req),
      req.params.taskId,
      req.body
    );
    sendSuccess(res, 200, result.message, result);
  }),

  updateTask: catchAsync(async (req: Request, res: Response) => {
    const result = await clientService.updateTask(uid(req), req.params.taskId, req.body);
    sendSuccess(res, 200, "Task updated", result);
  }),

  cancelTask: catchAsync(async (req: Request, res: Response) => {
    const result = await clientService.cancelTask(uid(req), req.params.taskId);
    sendSuccess(res, 200, "Task cancelled", result);
  }),

  raiseDispute: catchAsync(async (req: Request, res: Response) => {
    const dispute = await clientService.raiseDispute(
      uid(req),
      req.params.taskId,
      req.body
    );
    sendSuccess(res, 201, "Dispute opened", dispute);
  }),

  listPayments: catchAsync(async (req, res: Response) => {
    const payments = await clientService.listPayments(uid(req));
    sendSuccess(res, 200, "Your spend", payments);
  }),

  listPaymentMethods: catchAsync(async (req, res: Response) => {
    const methods = await clientService.listPaymentMethods(uid(req));
    sendSuccess(res, 200, "Payment methods", methods);
  }),

  addPaymentMethod: catchAsync(async (req, res: Response) => {
    const method = await clientService.addPaymentMethod(uid(req), req.body);
    sendSuccess(res, 201, "Payment method added", method);
  }),

  // Task chat (shared module)
  listMessages: catchAsync(async (req: Request, res: Response) => {
    const msgs = await chatService.list(req.params.taskId, uid(req), req.user!.role);
    sendSuccess(res, 200, "Messages", msgs);
  }),

  postMessage: catchAsync(async (req: Request, res: Response) => {
    const msg = await chatService.post(
      req.params.taskId,
      uid(req),
      req.user!.role,
      req.body.body,
      req.body.attachment
    );
    sendSuccess(res, 201, "Message sent", msg);
  }),
};
