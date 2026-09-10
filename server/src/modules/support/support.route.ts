import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { supportController } from "./support.controller";
import { createTicketSchema } from "./support.validator";

const router = Router();

// Clients and students open and view their own tickets; moderators answer them
// via the moderator console.
router.use(authenticate, authorize(Role.CLIENT, Role.STUDENT));

router.post("/", validate(createTicketSchema), supportController.create);
router.get("/", supportController.listMine);

export default router;
