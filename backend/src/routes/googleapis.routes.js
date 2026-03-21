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
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar"
    ],
    state: "login"
  });

  res.redirect(url);
});



// ✅ STEP 2: Handle Google callback, link tokens to user, redirect to frontend
// STEP 2: Handle Google callback
router.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get Google profile
    const oauth2 = google.oauth2("v2");
    const { data } = await oauth2.userinfo.get({ auth: oauth2Client });

    // Find or create user
    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = await User.create({
        username: data.name,
        email: data.email,
      });
    }

    // Save calendar tokens
    await User.findByIdAndUpdate(user._id, {
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
      hasGoogleAccount: true,
    });

    // Create JWT
    const jwtToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend
    res.redirect(
      `http://localhost:5173/google-success?token=${jwtToken}&userId=${user._id}&username=${encodeURIComponent(user.username)}`
    );
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).send("Google login failed");
  }
});




export default router;