import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { env } from "@/config/env";
import { paymentService } from "./payment.service";

/**
 * SSLCommerz callbacks. success/fail/cancel are browser redirects (the payer
 * lands back in the app); ipn is a server-to-server notification. success + ipn
 * both re-validate the transaction before moving any money.
 */
const back = (res: Response, status: "funded" | "failed" | "cancelled") =>
  res.redirect(303, `${env.appUrl.replace(/\/+$/, "")}/app/client/?payment=${status}`);

export const paymentController = {
  success: catchAsync(async (req: Request, res: Response) => {
    const ok = await paymentService.confirm(req.body.tran_id, req.body.val_id);
    back(res, ok ? "funded" : "failed");
  }),

  fail: catchAsync(async (req: Request, res: Response) => {
    await paymentService.markFailed(req.body.tran_id);
    back(res, "failed");
  }),

  cancel: catchAsync(async (req: Request, res: Response) => {
    await paymentService.markFailed(req.body.tran_id);
    back(res, "cancelled");
  }),

  // Server-to-server; just acknowledge.
  ipn: catchAsync(async (req: Request, res: Response) => {
    await paymentService.confirm(req.body.tran_id, req.body.val_id);
    res.json({ received: true });
  }),
};
