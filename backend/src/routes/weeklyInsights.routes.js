import express from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  generateInsightsForUser,
  getUserWeeklyInsights,
} from "../controllers/weeklyInsights.controller.js";

const router = express.Router();


router.post("/generate", verifyJwt, generateInsightsForUser);


router.get("/me", verifyJwt, getUserWeeklyInsights);

export default router;