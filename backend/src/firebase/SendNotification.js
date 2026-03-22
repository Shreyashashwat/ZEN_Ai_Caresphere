import cron from "node-cron";
import admin from "./firebaseAdmin.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { User } from "../model/user.model.js";
// import { User } from "../model/user.model.js";

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
     
      const dueReminders = await Reminder.find({
        status: "pending",
        notified: false,
        time: { $lte: now },
      }).select("_id medicineId userId").lean();

      if (dueReminders.length === 0) {
        // nothing to do
      } else {
        // Deduplicate: keep only ONE reminder per (medicineId, userId) pair
        // to avoid sending multiple notifications for the same medicine at once.
        const seen = new Set();
        const uniqueIds = [];
        for (const r of dueReminders) {
          const key = `${r.medicineId}_${r.userId}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueIds.push(r._id);
          }
        }

        // Atomically mark only the deduped reminders as notified
        await Reminder.updateMany(
          { _id: { $in: uniqueIds } },
          { $set: { notified: true } }
        );

        // Mark the non-chosen duplicates as missed so they don't linger
        const allIds = dueReminders.map(r => r._id);
        const skippedIds = allIds.filter(
          id => !uniqueIds.some(uid => uid.equals(id))
        );
        if (skippedIds.length > 0) {
          await Reminder.updateMany(
            { _id: { $in: skippedIds } },
            { $set: { status: "missed", processedMissed: true, notified: true } }
          );
          console.log(`🧹 Cleaned ${skippedIds.length} duplicate reminder(s)`);
        }

        // Fetch the claimed reminders fully populated for FCM sending
        const reminders = await Reminder.find({ _id: { $in: uniqueIds } })
          .populate("medicineId userId");

        for (const reminder of reminders) {
          const user = reminder.userId;
          const medicine = reminder.medicineId;

          if (!user?.fcmToken || !medicine) continue;

          const sent = await sendNotification(
            user.fcmToken,
            medicine,
            user._id
          );

          // If send failed, reset notified so it retries next minute
          if (!sent) {
            await Reminder.findByIdAndUpdate(reminder._id, { $set: { notified: false } });
            continue;
          }

          console.log(`🔔 Notified reminder ${reminder._id} (${medicine.medicineName})`);
        }
      }

      /* ⚠️ HANDLE MISSED REMINDERS */
      // Use $ne:true so we also catch old documents where processedMissed field is absent
      const lateReminders = await Reminder.find({
        status: "pending",
        processedMissed: { $ne: true },
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