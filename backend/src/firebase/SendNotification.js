import cron from "node-cron";
import admin from "./firebaseAdmin.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { handleMissedReminder } from "../controllers/reminder.controller.js";

/* 🔔 Send DATA-ONLY FCM */
async function sendNotification(token, medicine) {
  const message = {
    token,
    data: {
      title: "💊 Medicine Reminder",
      body: `Time to take your medicine: ${medicine.medicineName} (${medicine.dosage})`,
      medicineId: medicine._id.toString(),
    },
  };

  await admin.messaging().send(message);
}

/* 🕒 Minute Cron */
const sendnoti = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
      /* 🔔 SEND REMINDERS (ONLY ONCE) */
      const reminders = await Reminder.find({
        status: "pending",
        notified: false,               // 🔥 KEY FIX
        time: { $lte: now },
      }).populate("medicineId userId");

      for (const reminder of reminders) {
        const user = reminder.userId;
        const medicine = reminder.medicineId;

        if (!user?.fcmToken || !medicine) continue;

        await sendNotification(user.fcmToken, medicine);

        reminder.notified = true;     // 🔒 LOCK notification
        await reminder.save();

        console.log(
          `🔔 Notified reminder ${reminder._id} (${medicine.medicineName})`
        );
      }

      /* ⚠️ HANDLE MISSED REMINDERS (ONCE) */
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
        await handleMissedReminder(reminder._id);

        console.log(`⚠️ Marked missed: ${reminder._id}`);
      }
    } catch (err) {
      console.error("❌ Notification cron error:", err);
    }
  });

  console.log("🕐 Minute notification cron scheduled.");
};

export { sendnoti };
