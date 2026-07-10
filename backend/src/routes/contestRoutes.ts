import { Router } from "express";
import {
  createContest,
  listContests,
  getContest,
  publishContest,
  joinContest,
  closeRegistration,
  openSubmissions,
  closeSubmissions,
  getProgress,
  publishContestResults,
  resolveContestTie,
  addJudgeToContest,
  replaceJudge,
  getLeaderboard,
  getMyParticipation,
  getSubmissionsForAdmin,
} from "../controllers/contestController";
import { createSubmission, getMySubmission } from "../controllers/submissionController";
import { listSubmissionsToJudge } from "../controllers/scoreController";
import { protect, restrictTo } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// ── Public browsing — no auth required ───────────────────────────────
router.get("/", listContests);
router.get("/:id", getContest);
router.get("/:id/leaderboard", getLeaderboard);

// ── Admin: creation & lifecycle ──────────────────────────────────────
router.post("/", protect, restrictTo("admin"), createContest);
router.post("/:id/publish", protect, restrictTo("admin"), publishContest);
router.post("/:id/close-registration", protect, restrictTo("admin"), closeRegistration);

router.post("/:id/submissions/open", protect, restrictTo("admin"), openSubmissions);
router.post("/:id/submissions/close", protect, restrictTo("admin"), closeSubmissions);
router.get("/:id/progress", protect, restrictTo("admin"), getProgress);
router.post("/:id/publish-results", protect, restrictTo("admin"), publishContestResults);
router.post("/:id/resolve-tie", protect, restrictTo("admin"), resolveContestTie);

router.post("/:id/judges", protect, restrictTo("admin"), addJudgeToContest);
router.post("/:id/judges/:judgeId/replace", protect, restrictTo("admin"), replaceJudge);
router.get("/:id/submissions/all", protect, restrictTo("admin"), getSubmissionsForAdmin);

// ── Participant actions ───────────────────────────────────────────────
router.get("/:id/participation", protect, restrictTo("participant"), getMyParticipation);
router.post("/:id/join", protect, restrictTo("participant"), joinContest);
router.post(
  "/:id/submissions",
  protect,
  restrictTo("participant"),
  upload.single("photo"),
  createSubmission
);
router.get("/:id/submissions/mine", protect, restrictTo("participant"), getMySubmission);

// ── Judge actions ──────────────────────────────────────────────────────
router.get("/:id/submissions/to-judge", protect, restrictTo("judge"), listSubmissionsToJudge);

export default router;
