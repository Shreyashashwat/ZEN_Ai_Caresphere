import { google } from "googleapis";
import { Calendar } from "../model/calendar.model.js";

export async function addMedicineToGoogleCalendar(calendarData, medicine, doseTime) {
  console.log("Using tokens:", calendarData.accessToken, calendarData.refreshToken, calendarData.expiryDate);

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
        { userId: calendarData.userId },
        {
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          ...(tokens.access_token && { accessToken: tokens.access_token }),
          expiryDate: tokens.expiry_date,
        }
      );
    }
  });

  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(doseTime);
  const end = new Date(start.getTime() + 15 * 60 * 1000); // 15 min event

  const event = {
    summary: `${medicine.medicineName} 💊`,
    description: `Take ${medicine.dosage}`,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 10 }],
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  console.log("✅ Event created:", response.data.htmlLink);
  return response.data.id;
}
export async function updateMedicineInGoogleCalendar(reminder, calendarData, newTime, note) {
  if (!calendarData) {
    console.log("⚠️ No calendar data for user:", reminder.userId);
    return;
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

  // 🔁 Refresh token if needed
  auth.on("tokens", async (tokens) => {
    if (tokens.refresh_token || tokens.access_token) {
      await Calendar.findOneAndUpdate(
        { userId: calendarData.userId },
        {
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          ...(tokens.access_token && { accessToken: tokens.access_token }),
          expiryDate: tokens.expiry_date,
        }
      );
    }
  });

  const calendar = google.calendar({ version: "v3", auth });

  try {
    const eventId = reminder.eventId;
    if (!eventId) {
      console.warn(`⚠️ No eventId found for reminderpossible ${reminder._id}`);
      return;
    }

    const start = new Date(newTime);
    const end = new Date(start.getTime() + 15 * 60 * 1000);

    const updatedEvent = {
      summary: `${reminder.medicineId?.medicineName || "Medicine"} 💊`,
      description: note || "Updated medicine reminder",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    };

    await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: updatedEvent,
    });

    console.log(`✅ Google Calendar updated for ${note}: ${eventId}`);
  } catch (error) {
    console.error("❌ Failed to update Google Calendar event:", error.message);
  }
}