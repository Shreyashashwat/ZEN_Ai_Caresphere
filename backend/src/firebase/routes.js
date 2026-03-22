import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";
import { Medicine } from "../model/medicine.model.js";
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:8000/api/v1/oauth2callback"
);

// 1️⃣ Start Google OAuth
router.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar",
    ],
  });

  res.redirect(url);
});

// 2️⃣ OAuth Callback
router.get("/oauth2callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2("v2");
    const { data } = await oauth2.userinfo.get({
      auth: oauth2Client,
    });

    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = await User.create({
        username: data.name.toLowerCase(),
        email: data.email,
        hasGoogleAccount: true,
      });
    }

    await User.findByIdAndUpdate(user._id, {
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
      hasGoogleAccount: true,
    });

    const jwtToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(
      `http://localhost:5174/google-success?token=${jwtToken}&userId=${user._id}&username=${encodeURIComponent(user.username)}`
    );
  } catch (err) {
    console.error(err);
    res.status(401).send("Google OAuth failed");
  }
});
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
