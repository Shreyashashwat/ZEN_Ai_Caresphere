import cron from "node-cron";
import admin from "./firebaseAdmin.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { handleMissedReminder } from "../controllers/reminder.controller.js";

/** 🔔 Send FCM notification */
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
    console.log(`✅ Notification sent`);
  } catch (err) {
    console.error("❌ Error sending notification:", err);
  }
}

/** 🕒 Minute Cron: ONLY sends notifications for existing reminders */
const sendnoti = () => {
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Notification cron triggered:", new Date().toLocaleString());

    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60 * 1000);
      const windowEnd = new Date(now.getTime() + 60 * 1000);

      // 🔎 Find reminders due now
      const reminders = await Reminder.find({
        status: "pending",
        time: { $gte: windowStart, $lte: windowEnd },
      }).populate("medicineId userId");

      for (const reminder of reminders) {
        const user = reminder.userId;
        const medicine = reminder.medicineId;

        if (!user || !user.fcmToken || !medicine) continue;

        // 🔔 Send notification
        await sendNotification(user.fcmToken, medicine);

        console.log(
          `🔔 Reminder notified: ${medicine.medicineName} for user ${user._id}`
        );
      }

      // ⚠️ Handle missed reminders (>30 minutes late)
      const lateReminders = await Reminder.find({
        status: "pending",
        processedMissed: false,
        time: { $lt: new Date(now.getTime() - 30 * 60 * 1000) },
      });

      for (const reminder of lateReminders) {
        const medicine = await Medicine.findById(reminder.medicineId);
        reminder.processedMissed = true;
        if (medicine) {
          medicine.missedCount += 1;
          await medicine.save();
        }

        await handleMissedReminder(reminder._id);

        console.log(`⚠️ Marked as missed reminder ${reminder._id}`);
      }
    } catch (err) {
      console.error("❌ Error in notification cron:", err);
    }
  });

  console.log("🕐 Minute notification cron scheduled.");
};

export { sendnoti };
