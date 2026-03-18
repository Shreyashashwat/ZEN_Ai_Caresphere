import express from "express";
import { trainAdherenceModel } from "../ml/train.js";
import { predictAdherenceRisk } from "../ml/predict.js";

const router = express.Router();

router.post("/train", async (req, res) => {
  try {
    const result = await trainAdherenceModel();
    res.json({ success: true, message: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/predict", async (req, res) => {
  try {
    const { hour, dayOfWeek, delay } = req.body;

    const risk = await predictAdherenceRisk(hour, dayOfWeek, delay);

    res.json({
      success: true,
      risk
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;