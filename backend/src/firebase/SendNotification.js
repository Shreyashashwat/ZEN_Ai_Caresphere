import cron from "node-cron";
import admin from "./firebaseAdmin.js";
import { Reminder } from "../model/reminderstatus.js";
<<<<<<< HEAD
import { addMedicineToGoogleCalendar } from "../utils/googleCalendar.js";

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/* ================= EMAIL SETUP ================= */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================= EMAIL ================= */
async function sendEmail(to, subject, text, html) {
  await transporter.sendMail({
    from: `"CareSphere" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

/* ================= FCM ================= */
async function sendNotification(token, medicine) {
  const message = {
    data: {
      title: "Medicine Reminder",
      body: `Time to take your medicine: ${medicine.medicineName}`,
      medicineId: medicine._id.toString(),
    },
    token,
=======
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
>>>>>>> e56d319948efe25fc699c8a4890e2c61522b0fbd
  };

  await admin.messaging().send(message);
}

/* 🕒 Minute Cron */
const sendnoti = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
<<<<<<< HEAD
    const medicines = await Medicine.find().populate("userId");

    for (const med of medicines) {
      const user = med.userId;
      if (!user) continue;

      for (const t of med.time) {
        const [h, m] = t.split(":").map(Number);
        const medTime = new Date(now);
        medTime.setHours(h, m, 0, 0);

        if (Math.abs(medTime - now) < 120000) {
          if (user.fcmToken) await sendNotification(user.fcmToken, med);

          if (user.email)
            await sendEmail(
              user.email,
              "Medicine Reminder",
              "",
              `<b>${med.medicineName}</b>`
            );

          const reminder = await Reminder.create({
            medicineId: med._id,
            userId: user._id,
            time: medTime,
            status: "pending",
          });

          med.statusHistory.push(reminder._id);
          med.lastNotified = now;
          await med.save();
        }
      }
    }
  });
=======

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
>>>>>>> e56d319948efe25fc699c8a4890e2c61522b0fbd
};

export { sendnoti };
