import cron from "node-cron";
import admin from "./firebaseAdmin.js";
import { Medicine } from "../model/medicine.model.js";
import { Reminder } from "../model/reminderstatus.js";
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
export async function sendEmail(to, subject, text, html) {
    await transporter.sendMail({
        from: `"CareSphere" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
    });
}

/* ================= FCM ================= */
export async function sendPushNotification(token, title, body, data = {}) {
    const message = {
        notification: {
            title,
            body
        },
        data: data || {},
        token
    };
    try {
        await admin.messaging().send(message);
    } catch (err) {
        console.error("FCM Send Error:", err);
    }
}

async function sendNotification(token, medicine) {
    const message = {
        data: {
            title: "Medicine Reminder",
            body: `Time to take your medicine: ${medicine.medicineName}`,
            medicineId: medicine._id.toString(),
        },
        token,
    };

    await admin.messaging().send(message);
}

/* ================= CRON ================= */
const sendnoti = () => {
    cron.schedule("* * * * *", async () => {
        const now = new Date();
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
};

export { sendnoti };