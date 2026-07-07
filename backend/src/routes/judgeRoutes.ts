import { Router } from "express";
import { createJudge, listJudges } from "../controllers/judgeController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect, restrictTo("admin"));
router.post("/", createJudge);
router.get("/", listJudges);

export default router;
