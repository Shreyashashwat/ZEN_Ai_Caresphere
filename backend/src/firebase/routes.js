import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:8000/api/v1/oauth2callback"
);

// 1 Start Google OAuth
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

// 2 OAuth Callback
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

export default router;