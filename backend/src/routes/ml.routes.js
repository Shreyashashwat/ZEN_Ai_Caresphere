import express from "express";

import { trainAdherenceModel } from "../ml/train.js";
import { getUserWeeklyInsights } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/train", async (req, res) => {
  try {
    await trainAdherenceModel();
    res.json({ success: true, message: "Model trained successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// In your routes file
router.get('/weekly-insights/:userId', getUserWeeklyInsights);
export default router;
