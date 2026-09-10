import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { studentService } from "./student.service";
import { chatService } from "@/modules/chat/chat.service";

const uid = (req: Request) => req.user!.sub;

export const studentController = {
  getProfile: catchAsync(async (req, res: Response) => {
    sendSuccess(res, 200, "Profile", await studentService.profile(uid(req)));
  }),

  updateProfile: catchAsync(async (req, res: Response) => {
    const p = await studentService.updateProfile(uid(req), req.body);
    sendSuccess(res, 200, "Profile updated", p);
  }),

  submitKyc: catchAsync(async (req, res: Response) => {
    const docs = req.body.documents.map((d: { label: string; detail: string }) => ({
      ...d,
      ok: false,
    }));
    const sub = await studentService.submitKyc(uid(req), docs);
    sendSuccess(res, 201, "Verification submitted for review", sub);
  }),

  myKyc: catchAsync(async (req, res: Response) => {
    sendSuccess(res, 200, "Verification status", await studentService.myKyc(uid(req)));
  }),

  browse: catchAsync(async (req: Request, res: Response) => {
    const tasks = await studentService.browse(uid(req), {
      sectorId: req.query.sectorId as string | undefined,
    });
    sendSuccess(res, 200, "Tasks", tasks);
  }),

  taskDetail: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, 200, "Task detail", await studentService.taskDetail(req.params.taskId));
  }),

  apply: catchAsync(async (req: Request, res: Response) => {
    const attempt = await studentService.applyToTrial(uid(req), req.params.taskId, req.body);
    sendSuccess(res, 201, "Trial submitted and scored", attempt);
  }),

  listTrials: catchAsync(async (req, res: Response) => {
    sendSuccess(res, 200, "Your trials", await studentService.listTrials(uid(req)));
  }),

  points: catchAsync(async (req, res: Response) => {
    sendSuccess(res, 200, "Your points", await studentService.points(uid(req)));
  }),

  listActive: catchAsync(async (req, res: Response) => {
    sendSuccess(res, 200, "Active tasks", await studentService.listActive(uid(req)));
  }),

  reportProgress: catchAsync(async (req: Request, res: Response) => {
    const t = await studentService.reportProgress(uid(req), req.params.taskId, req.body.progress);
    sendSuccess(res, 200, "Progress updated", t);
  }),

  submitWork: catchAsync(async (req: Request, res: Response) => {
    const t = await studentService.submitWork(uid(req), req.params.taskId, req.body.note);
    sendSuccess(res, 200, "Work submitted for review", t);
  }),

  record: catchAsync(async (req, res: Response) => {
    sendSuccess(res, 200, "Verified record", await studentService.listRecord(uid(req)));
  }),

  earnings: catchAsync(async (req, res: Response) => {
    sendSuccess(res, 200, "Earnings", await studentService.earnings(uid(req)));
  }),

  raiseDispute: catchAsync(async (req: Request, res: Response) => {
    const d = await studentService.raiseDispute(uid(req), req.params.taskId, req.body);
    sendSuccess(res, 201, "Dispute opened", d);
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
