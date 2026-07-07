import { Router } from "express";
import { register, login, logout, me, changePassword, updateProfile } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, me);
router.patch("/change-password", protect, changePassword);
router.patch("/profile", protect, updateProfile);

export default router;
