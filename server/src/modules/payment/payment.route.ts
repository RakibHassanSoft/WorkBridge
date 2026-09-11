import { Router } from "express";
import { paymentController } from "./payment.controller";

/**
 * Public SSLCommerz callbacks — the gateway (not a signed-in user) calls these,
 * so there is no auth middleware. Every money-moving path re-validates the
 * transaction with SSLCommerz before doing anything.
 */
const router = Router();

router.post("/sslcommerz/success", paymentController.success);
router.post("/sslcommerz/fail", paymentController.fail);
router.post("/sslcommerz/cancel", paymentController.cancel);
router.post("/sslcommerz/ipn", paymentController.ipn);

export default router;
