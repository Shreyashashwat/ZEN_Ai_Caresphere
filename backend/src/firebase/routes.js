// backend/firebase/routes.js
import express from "express";
import { User } from "../model/user.model.js";
import { Medicine } from "../model/medicine.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, token } = req.body;
    console.log("Received request body:", req.body);

  
    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "userId and token are required",
      });
    }


    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found with id:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

   
    user.fcmToken = token;
    await user.save();

    console.log(`✅ FCM token saved for user ${userId}: ${token}`);
    res.status(200).json({
      success: true,
      message: "Token saved!",
      data: {
        userId: user._id,
        fcmToken: user.fcmToken,
      },
    });
  } catch (err) {
    console.error("Error saving FCM token:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
router.post("/snooze/:medId", async (req, res) => {
  const { medId } = req.params;
  const { minutes } = req.body;

  const med = await Medicine.findById(medId);
  if (!med) return res.status(404).json({ message: "Medicine not found" });

  med.snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
  await med.save();

  res.json({
    message: `⏱️ ${med.medicineName} snoozed for ${minutes} minutes`,
    snoozedUntil: med.snoozedUntil,
  });
});

export default router;