import { Router } from "express";
import { listNotifications, markAllRead, markOneRead } from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/", listNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markOneRead);

export default router;
