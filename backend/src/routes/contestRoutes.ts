import { Router } from "express";
import {
  createContest,
  listContests,
  getContest,
  publishContest,
  joinContest,
  closeRegistration,
  openRound1,
  closeRound1,
  getRound1Progress,
  publishRound1,
  resolveRound1Tie,
  openFinal,
  closeFinal,
  getFinalProgress,
  publishFinal,
  resolveFinalTie,
  addJudgeToContest,
  replaceJudge,
  getLeaderboard,
  getMyParticipation,
  getRoundSubmissionsForAdmin,
} from "../controllers/contestController";
import { createSubmission, getMySubmission } from "../controllers/submissionController";
import { listSubmissionsToJudge } from "../controllers/scoreController";
import { protect, restrictTo } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// ── Public browsing — no auth required ───────────────────────────────
router.get("/", listContests);
router.get("/:id", getContest);
router.get("/:id/leaderboard/:round", getLeaderboard);

// ── Admin: creation & lifecycle ──────────────────────────────────────
router.post("/", protect, restrictTo("admin"), createContest);
router.post("/:id/publish", protect, restrictTo("admin"), publishContest);
router.post("/:id/close-registration", protect, restrictTo("admin"), closeRegistration);

router.post("/:id/round1/open", protect, restrictTo("admin"), openRound1);
router.post("/:id/round1/close", protect, restrictTo("admin"), closeRound1);
router.get("/:id/round1/progress", protect, restrictTo("admin"), getRound1Progress);
router.post("/:id/round1/publish-results", protect, restrictTo("admin"), publishRound1);
router.post("/:id/round1/resolve-tie", protect, restrictTo("admin"), resolveRound1Tie);

router.post("/:id/final/open", protect, restrictTo("admin"), openFinal);
router.post("/:id/final/close", protect, restrictTo("admin"), closeFinal);
router.get("/:id/final/progress", protect, restrictTo("admin"), getFinalProgress);
router.post("/:id/final/publish-winners", protect, restrictTo("admin"), publishFinal);
router.post("/:id/final/resolve-tie", protect, restrictTo("admin"), resolveFinalTie);

router.post("/:id/judges", protect, restrictTo("admin"), addJudgeToContest);
router.post("/:id/judges/:judgeId/replace", protect, restrictTo("admin"), replaceJudge);
router.get("/:id/submissions/:round/all", protect, restrictTo("admin"), getRoundSubmissionsForAdmin);

// ── Participant actions ───────────────────────────────────────────────
router.get("/:id/participation", protect, restrictTo("participant"), getMyParticipation);
router.post("/:id/join", protect, restrictTo("participant"), joinContest);
router.post(
  "/:id/submissions/:round",
  protect,
  restrictTo("participant"),
  upload.single("photo"),
  createSubmission
);
router.get("/:id/submissions/:round/mine", protect, restrictTo("participant"), getMySubmission);

// ── Judge actions ──────────────────────────────────────────────────────
router.get("/:id/submissions/:round/to-judge", protect, restrictTo("judge"), listSubmissionsToJudge);

export default router;
