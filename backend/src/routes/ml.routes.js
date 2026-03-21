// routes/mlRoute.js
import express from "express";

import { trainAdherenceModel } from "../ml/train.js";

const router = express.Router();

router.post("/train", async (req, res) => {
  try {
    await trainAdherenceModel();
    res.json({ success: true, message: "Model trained successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


export default router;
