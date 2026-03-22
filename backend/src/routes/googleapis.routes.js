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

// STEP 1a: Login flow (no token)
router.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    state: "login"
  });
  res.redirect(url);
});

// STEP 1b: Connect calendar flow (logged-in user passes their token)
router.get("/auth/google/connect-calendar", (req, res) => {
  const token = req.query.token; // JWT from localStorage
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    state: `connect_calendar:${token}` // encode who is connecting
  });
  res.redirect(url);
});

// STEP 2: Single callback handles both
router.get("/oauth2callback", async (req, res) => {
  const { code, state } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2("v2");
    const { data } = await oauth2.userinfo.get({ auth: oauth2Client });

    // ── CONNECT CALENDAR FLOW ──
    if (state?.startsWith("connect_calendar:")) {
      const jwtToken = state.replace("connect_calendar:", "");
      const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

      await User.findByIdAndUpdate(decoded.id || decoded._id, {
        googleTokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
        },
        hasGoogleAccount: true,
        googleEmail: data.email,  // save which Gmail was linked
      });

      // Also save to Calendar model if you use it
      await Calendar.findOneAndUpdate(
        { userId: decoded.id || decoded._id },
        {
          userId: decoded.id || decoded._id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date),
        },
        { upsert: true }
      );

      return res.redirect(`http://localhost:5173/patient?calendarConnected=true`);
    }

    // ── LOGIN FLOW ──
    // Only allow existing users to login (no auto-creation)
    console.log(`🔍 Checking if user exists with email: ${data.email}`);
    let user = await User.findOne({ email: data.email });
    
    if (!user) {
      console.log(`❌ No user found with email: ${data.email}`);
      // User doesn't exist - redirect to login with error
      return res.redirect(
        `http://localhost:5173/?error=${encodeURIComponent("Account not found. Please register with your email first.")}`
      );
    }
    
    console.log(`✅ User found: ${user.username} (${user.email})`);

    // Update existing user with Google tokens
    await User.findByIdAndUpdate(user._id, {
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
      hasGoogleAccount: true,
      googleEmail: data.email,
    });

    const jwtToken = jwt.sign(
      { _id: user._id , role: user.role || "user"},
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(
     `http://localhost:5173/google-success?token=${jwtToken}&userId=${user._id}&username=${encodeURIComponent(user.username)}&role=${user.role || "user"}`
    );

  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(401).send("Google authentication failed");
  }
});

export default router;