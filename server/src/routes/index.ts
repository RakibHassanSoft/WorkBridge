import { Router } from "express";
import authRoutes from "@/modules/auth/auth.route";
import userRoutes from "@/modules/user/user.route";
import clientRoutes from "@/modules/client/client.route";
import studentRoutes from "@/modules/student/student.route";
import moderatorRoutes from "@/modules/moderator/moderator.route";
import supportRoutes from "@/modules/support/support.route";
import { taskService } from "@/modules/task/task.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import paymentRoutes from "@/modules/payment/payment.route";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "BDFreshers API is healthy" });
});

// Public task board — the /tasks page. Real tasks from the database, no auth.
router.get(
  "/tasks",
  catchAsync(async (_req, res) => {
    sendSuccess(res, 200, "Task board", await taskService.listBoard());
  })
);

router.use("/payments", paymentRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/client", clientRoutes);
router.use("/student", studentRoutes);
router.use("/moderator", moderatorRoutes);
router.use("/support", supportRoutes);

export default router;
