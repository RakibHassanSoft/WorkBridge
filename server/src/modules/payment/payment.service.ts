import { PayStatus } from "@prisma/client";
import prisma from "@/config/prisma";
import { taskService } from "@/modules/task/task.service";
import { validate } from "./sslcommerz";

/**
 * Confirm an SSLCommerz transaction and, if it checks out, move the matching
 * escrow to HELD and let the task go live. Called from the gateway callbacks
 * (success + IPN). Idempotent: a payment already HELD/RELEASED is left alone.
 */
export const paymentService = {
  async confirm(tranId: string | undefined, valId: string | undefined): Promise<boolean> {
    if (!tranId || !valId) return false;

    const check = await validate(valId);
    if (!check.valid || (check.tranId && check.tranId !== tranId)) return false;

    const payment = await prisma.payment.findFirst({ where: { tranId } });
    if (!payment) return false;
    if (payment.status === PayStatus.HELD || payment.status === PayStatus.RELEASED) return true; // already done

    // Guard against a tampered amount.
    if (check.amount !== undefined && Math.round(check.amount) !== payment.amount) return false;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PayStatus.HELD, note: "Held in escrow until sign-off" },
    });
    await taskService.maybeActivate(payment.taskId);
    return true;
  },

  /** Mark a payment failed (fail/cancel callbacks), if it is still awaiting. */
  async markFailed(tranId: string | undefined) {
    if (!tranId) return;
    const payment = await prisma.payment.findFirst({ where: { tranId } });
    if (payment && payment.status === PayStatus.AWAITING) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { note: "Payment not completed" },
      });
    }
  },
};
