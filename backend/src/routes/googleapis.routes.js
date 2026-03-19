import express from "express";
import { google } from "googleapis";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Calendar } from "../model/calendar.model.js";
import { User } from "../model/user.model.js";

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:8000/api/v1/oauth2callback"
);

// ✅ STEP 1: Redirect user to Google OAuth with JWT token encoded in state
// STEP 1: Redirect user to Google
router.get("/auth/google", (req, res) => {
  try {
    const { token } = req.query; // JWT token from frontend
    if (!token) return res.status(400).send("Missing user token.");

    // Verify the token here
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use JWT itself in "state" for Google OAuth
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",      // 👈 forces refresh_token on repeated logins
      scope: ["https://www.googleapis.com/auth/calendar"],
      state: token, // carry entire JWT, not just userId
    });

    res.redirect(url);
  } catch (err) {
    console.error("Error generating Google Auth URL:", err);
    res.status(500).send("Failed to initiate Google OAuth.");
  }
});


// ✅ STEP 2: Handle Google callback, link tokens to user, redirect to frontend
// STEP 2: Handle Google callback
router.get("/oauth2callback", async (req, res) => {
  const { code, state } = req.query;
  if (!state) return res.status(401).send("Missing token in state");
  console.log('/oatuht2222')

  try {
    // Decode JWT passed in 'state'
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded._id  // ✅ Fix here
    console.log(userId,"yess got the userr id");

    // Exchange code for access & refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("tokens",tokens);
    oauth2Client.setCredentials(tokens);

    // Save Google tokens to the existing user
    await User.findByIdAndUpdate(userId, {
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
      hasGoogleAccount: true, // 👈 optional flag to mark connection
    });

    // Update or create calendar entry linked to the same user
    await Calendar.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      },
      { upsert: true, new: true }
    );

    // ✅ Redirect to frontend
    res.redirect("http://localhost:5173/patient?connected=google");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(401).send("Google Auth failed or invalid token");
  }
});



export default router;
