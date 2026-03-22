import cron from "node-cron";
import admin from "./firebaseAdmin.js";

import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { User } from "../model/user.model.js";
// import { User } from "../model/user.model.js";
/* ✅ Raw function - no asyncHandler, safe to call from cron */
const handleMissedReminder = async (reminderId) => {
  const reminder = await Reminder.findById(reminderId);
  if (!reminder) return;

  if (reminder.autoAdjusted) {
    reminder.status = "missed";
    await reminder.save();
    return;
  }

  const newTime = new Date(reminder.time.getTime() + 5 * 60000);
  reminder.time = newTime;
  reminder.status = "pending";
  reminder.autoAdjusted = true;
  reminder.userResponseTime = null;
  await reminder.save();
};

/* 🔔 Send DATA-ONLY FCM */
async function sendNotification(token, medicine, userId) {
  const message = {
    token,
    data: {
      title: "💊 Medicine Reminder",
      body: `Time to take your medicine: ${medicine.medicineName} (${medicine.dosage})`,
      medicineId: medicine._id.toString(),
    },
  };

  try {
    await admin.messaging().send(message);
    console.log("✅ FCM sent successfully");
    return true;
  } catch (error) {
    console.error("❌ FCM Error:", error.code);

    if (error.code === "messaging/registration-token-not-registered") {
      console.log("🗑 Removing invalid FCM token for user:", userId);
      await User.findByIdAndUpdate(userId, {
        $unset: { fcmToken: 1 },
      });
    }

    return false;
  }
}

/* 🕒 Minute Cron */
let cronJobStarted = false;

const sendnoti = () => {
  if (cronJobStarted) {
    console.log("⚠️ Notification cron already running, skipping duplicate");
    return;
  }

  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
      /* 🔔 SEND REMINDERS */
      const reminders = await Reminder.find({
        status: "pending",
        notified: false,
        time: { $lte: now },
      }).populate("medicineId userId");

      for (const reminder of reminders) {
        const user = reminder.userId;
        const medicine = reminder.medicineId;

        if (!user?.fcmToken || !medicine) continue;

        const sent = await sendNotification(
          user.fcmToken,
          medicine,
          user._id
        );

        if (!sent) continue;

        reminder.notified = true;
        await reminder.save();

        console.log(
          `🔔 Notified reminder ${reminder._id} (${medicine.medicineName})`
        );
      }

      /* ⚠️ HANDLE MISSED REMINDERS */
      const lateReminders = await Reminder.find({
        status: "pending",
        processedMissed: false,
        time: { $lt: new Date(now.getTime() - 30 * 60 * 1000) },
      });

      for (const reminder of lateReminders) {
        reminder.processedMissed = true;
        reminder.status = "missed";

        const medicine = await Medicine.findById(reminder.medicineId);
        if (medicine) {
          medicine.missedCount += 1;
          await medicine.save();
        }

        await reminder.save();

        try {
          await handleMissedReminder(reminder._id);
        } catch (err) {
          console.error("⚠️ Missed reminder handler error:", err.message);
        }

        console.log(`⚠️ Marked missed: ${reminder._id}`);
      }
    } catch (err) {
      console.error("❌ Notification cron error:", err);
    }
  });

  cronJobStarted = true;
  console.log("✅ Minute notification cron scheduled (runs every minute)");
};

export { sendnoti };