// controllers/googleCalendar.controller.js
import { google } from "googleapis";
import { User } from "../model/user.model.js";
import { Calendar } from "../model/calendar.model.js";
import { Reminder } from "../model/reminderstatus.js";

export const getWebsiteGoogleEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const calendarData = await Calendar.findOne({ userId });
    if (!calendarData || !calendarData.accessToken) {
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

    // 🔁 Update DB when Google issues new tokens
    auth.on('tokens', async (tokens) => {
      if (tokens.refresh_token || tokens.access_token) {
        await Calendar.findOneAndUpdate(
          { userId },
          {
            ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
            ...(tokens.access_token && { accessToken: tokens.access_token }),
            expiryDate: tokens.expiry_date,
          }
        );
      }
    });

    const calendar = google.calendar({ version: "v3", auth });

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
          location: data.location,
        });
      } catch (err) {
        console.warn(`⚠️ Skipped missing/invalid event: ${r.eventId}`);
      }
    }

    res.json({ events });
  } catch (error) {
    console.error("Failed to fetch website events:", error.message);
    
    // If token is invalid/expired and can't be refreshed
    if (error.message.includes("invalid_grant") || error.message.includes("Invalid Credentials")) {
      return res.status(401).json({ message: "Google Calendar access expired. Please reconnect." });
    }
    
    res.status(500).json({ message: "Failed to fetch website events" });
  }
};
