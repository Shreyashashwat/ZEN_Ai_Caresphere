// controllers/googleCalendar.controller.js
import { google } from "googleapis";


import { Calendar } from "../model/calendar.model.js";
import { Reminder } from "../model/reminderstatus.js";

export const getWebsiteGoogleEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Find user's calendar tokens
    const calendarData = await Calendar.findOne({ userId });
    if (!calendarData) {
      return res.status(400).json({ message: "No Google Calendar linked" });
    }

    const reminders = await Reminder.find({ userId, eventId: { $exists: true } });

    if (reminders.length === 0) {
      return res.json({ events: [] });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:8000/api/v1/oauth2callback"
    );

    auth.setCredentials({
      access_token: calendarData.accessToken,
      refresh_token: calendarData.refreshToken,
      expiry_date: new Date(calendarData.expiryDate).getTime(),
    });

    const calendar = google.calendar({ version: "v3", auth });

    // 4️⃣ Fetch all your website-created events by eventId
    const events = [];
    for (const r of reminders) {
      try {
        const { data } = await calendar.events.get({
          calendarId: "primary",
          eventId: r.eventId,
        });
        events.push({
          id: data.id,
          summary: data.summary,
          start: data.start,
          end: data.end,
          description: data.description,
        });
      } catch (err) {
        console.warn(`⚠️ Skipped missing/invalid event: ${r.eventId}`);
      }
    }

    res.json({ events });
  } catch (error) {
    console.error("Failed to fetch website events:", error.message);
    res.status(500).json({ message: "Failed to fetch website events" });
  }
};
