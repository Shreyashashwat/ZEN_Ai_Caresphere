

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

//****************crone job******************** */
const sendnoti = () => {
  cron.schedule("* * * * *", async () => {
    console.log("🕒 Cron triggered:", new Date().toLocaleString());

    try {
      const now = new Date();
      const medicines = await Medicine.find().populate("userId");

      for (const med of medicines) {
        const user = med.userId;
        console.log(med.time);
        // console.log(`Medicine: ${med.medicineName}, Times:`, med.time);

        if (!user) {
          console.log("skipping");
          // console.log("Skipping, user missing", med);
          continue;
        }

        for (const t of med.time) {
          const [hours, minutes] = t.split(":").map(Number);
          const medTime = new Date(now);
          medTime.setHours(hours, minutes, 0, 0);

          const diff = Math.abs(medTime.getTime() - now.getTime());
          console.log(`Now: ${now.toTimeString()}, MedTime: ${medTime.toTimeString()}, Diff(ms): ${diff}`);

          // Only send if within 2 minutes window
          if (diff < 120000) {
            // Prevent duplicate notifications within same day
            if (med.lastNotified) {
              const last = new Date(med.lastNotified);
              if (
                last.toDateString() === now.toDateString() &&
                Math.abs(last.getTime() - medTime.getTime()) < 60000
              ) {
                console.log(`Already notified for ${med.medicineName} at ${t}`);
                continue;
              }
            }

            const title = `hii ${user.username}💊 Medicine Reminder`;
            const body = `Time to take your medicine: ${med.medicineName} (${med.dosage})`;

            // 🔹 Send FCM Notification (if token exists)
            if (user.fcmToken) {
              await sendNotification(user.fcmToken, title, body);
            }

            // 🔹 Send Email (if user email exists)
            if (user.email) {
              const html = `
                <div style="font-family: Arial, sans-serif; padding: 15px;">
                  <h2>💊 Medicine Reminder</h2>
                  <p>Hi ${user.username || "there"},</p>
                  <p>This is a reminder to take your medicine:</p>
                  <p><strong>${med.medicineName}</strong> (${med.dosage})</p>
                  <p>Scheduled time: ${t}</p>
                  <br/>
                  <p>Stay healthy!<br/>– CareSphere Team</p>
                </div>
              `;
              await sendEmail(user.email, title, body, html);
            }

            // Save lastNotified timestamp
            med.lastNotified = now;
            await med.save();
          }
        }
      }
    } catch (err) {
      console.error("Error in cron job:", err);
    }
  });

  console.log("Cron job scheduled: checking medicine reminders every minute.");
};

export { sendnoti };
