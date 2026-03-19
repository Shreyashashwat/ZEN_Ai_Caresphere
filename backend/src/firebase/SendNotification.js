import cron from "node-cron";
import admin from "./firebaseAdmin.js";
import { Medicine } from "../model/medicine.model.js";

/**
 * Send FCM data-only notification
 */
async function sendNotification(token, medicine) {
  const message = {
    data: {
      title: `💊 Medicine Reminder`,
      body: `Time to take your medicine: ${medicine.medicineName} (${medicine.dosage})`,
      medicineId: medicine._id.toString(),
    },
    token,
  };

  try {
    await admin.messaging().send(message);
    console.log(`✅ Notification sent to token: ${token}`);
  } catch (err) {
    console.error("❌ Error sending notification:", err);
  }
}

/**
 * Cron job for medicine reminders
 */
const sendnoti = () => {
  cron.schedule("* * * * *", async () => {
    console.log("🕒 Cron triggered:", new Date().toLocaleString());

    try {
      const now = new Date();
      const medicines = await Medicine.find().populate("userId");

      for (const med of medicines) {
        const user = med.userId;
        if (!user || !user.fcmToken) continue;

        for (const t of med.time) {
          const [hours, minutes] = t.split(":").map(Number);
          const medTime = new Date(now);
          medTime.setHours(hours, minutes, 0, 0);

          const diff = Math.abs(medTime.getTime() - now.getTime());

          if (med.snoozedUntil && med.snoozedUntil > now) continue;

          if (diff < 120000) {
            if (med.lastNotified) {
              const last = new Date(med.lastNotified);
              if (
                last.toDateString() === now.toDateString() &&
                Math.abs(last.getTime() - medTime.getTime()) < 60000
              )
                continue;
            }

            console.log(
              `💊 Sending notification for ${med.medicineName} to user ${user._id}`
            );
            

            await sendNotification(user.fcmToken, med);

            med.lastNotified = now;
            await med.save();
          }
        }
      }
    } catch (err) {
      console.error("❌ Error in cron job:", err);
    }
  });

  console.log("⏰ Cron job scheduled: checking medicine reminders every minute.");
};

export { sendnoti };