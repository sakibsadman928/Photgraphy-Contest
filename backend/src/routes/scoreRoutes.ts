import { Router } from "express";
import { submitScore } from "../controllers/scoreController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.post("/", protect, restrictTo("judge"), submitScore);

export default router;
