import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { supportService } from "./support.service";

export const supportController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const ticket = await supportService.create(req.user!.sub, req.body);
    sendSuccess(res, 201, "Support ticket opened", ticket);
  }),

  listMine: catchAsync(async (req: Request, res: Response) => {
    const tickets = await supportService.listMine(req.user!.sub);
    sendSuccess(res, 200, "Your tickets", tickets);
  }),
};
