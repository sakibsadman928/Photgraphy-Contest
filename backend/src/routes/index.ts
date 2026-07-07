import { Router } from "express";
import authRoutes from "./authRoutes";
import judgeRoutes from "./judgeRoutes";
import contestRoutes from "./contestRoutes";
import scoreRoutes from "./scoreRoutes";
import notificationRoutes from "./notificationRoutes";
import dashboardRoutes from "./dashboardRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/judges", judgeRoutes);
router.use("/contests", contestRoutes);
router.use("/scores", scoreRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
