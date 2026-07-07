import { Router } from "express";
import { participantDashboard, judgeDashboard, adminDashboard } from "../controllers/dashboardController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/participant", protect, restrictTo("participant"), participantDashboard);
router.get("/judge", protect, restrictTo("judge"), judgeDashboard);
router.get("/admin", protect, restrictTo("admin"), adminDashboard);

export default router;
