

import cron from "node-cron";
import admin from "./firebaseAdmin.js";
import { Medicine } from "../model/medicine.model.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === "true", // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify()

  .then(() => console.log("Email transporter ready"))
  .catch(err => console.error("Email transporter error:", err));


async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: `"CareSphere" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("email send");
    // console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}


async function sendNotification(token, title, body) {
  const message = { notification: { title, body }, token };
  try {
    await admin.messaging().send(message);
    console.log(`Notification sent to token: ${token}`);
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

/** 🕒 Cron Job: checks every minute for reminders */
const sendnoti = () => {
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Cron triggered:", new Date().toLocaleString());

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

          const diff = medTime.getTime() - now.getTime();

          // ⏭️ Skip if snoozed
          if (med.snoozedUntil && med.snoozedUntil > now) continue;

          // 🔔 Send reminder within 2 minutes window
          if (Math.abs(diff) < 120000) {
            const alreadySentToday =
              med.lastNotified &&
              med.lastNotified.toDateString() === now.toDateString() &&
              Math.abs(med.lastNotified.getTime() - medTime.getTime()) < 60000;

            if (alreadySentToday) continue;

            console.log(`💊 Sending notification for ${med.medicineName}`);

            // Send FCM
            await sendNotification(user.fcmToken, med);

            // 🔹 Create a Reminder entry
            const reminder = await Reminder.create({
              medicineId: med._id,
              userId: user._id,
              time: medTime,
              status: "pending",
            });

            // 🔹 Add to medicine history
            med.statusHistory.push(reminder._id);
            med.lastNotified = now;

            // 🔹 Optional: Sync to Google Calendar
            if (user.googleAuth) {
              try {
                const eventId = await addMedicineToGoogleCalendar(
                  user.googleAuth,
                  med,
                  medTime
                );
                reminder.eventId = eventId;
                await reminder.save();
              } catch (err) {
                console.error("⚠️ Google Calendar sync failed:", err.message);
              }
            }

            await med.save();
          }

          // ⚠️ Mark as missed if > 30 min late and still pending
          const missedTime = new Date(medTime.getTime() + 30 * 60 * 1000);
          if (now > missedTime) {
            const pendingReminder = await Reminder.findOne({
              medicineId: med._id,
              userId: user._id,
              time: medTime,
              status: "pending",
            });

            if (pendingReminder) {
              pendingReminder.status = "missed";
              pendingReminder.userResponseTime = now;
              await pendingReminder.save();

              med.missedCount += 1;
              await med.save();

              console.log(
                `⚠️ Marked as missed: ${med.medicineName} (${t}) for user ${user._id}`
              );
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ Error in cron job:", err);
    }
  });

  console.log("🕐 Reminder cron scheduled (every minute).");
};

export { sendnoti };
