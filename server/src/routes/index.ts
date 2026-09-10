import { Router } from "express";
import authRoutes from "@/modules/auth/auth.route";
import userRoutes from "@/modules/user/user.route";
import clientRoutes from "@/modules/client/client.route";
import studentRoutes from "@/modules/student/student.route";
import moderatorRoutes from "@/modules/moderator/moderator.route";
import supportRoutes from "@/modules/support/support.route";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "WorkBridge API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/client", clientRoutes);
router.use("/student", studentRoutes);
router.use("/moderator", moderatorRoutes);
router.use("/support", supportRoutes);

export default router;
