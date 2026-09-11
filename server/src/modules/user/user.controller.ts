import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { userService } from "./user.service";

export const userController = {
  getById: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.findById(req.params.id);
    sendSuccess(res, 200, "User retrieved", user);
  }),

  me: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.findById(req.user!.sub);
    sendSuccess(res, 200, "Current user", user);
  }),

  setAvatar: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.setAvatar(req.user!.sub, req.body.avatarUrl);
    sendSuccess(res, 200, "Photo updated", user);
  }),
};
