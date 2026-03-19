import express from "express";
import admin from "./firebaseAdmin.js";
import cron from "node-cron";
import {User} from "../model/user.model.js"; 


async function sendNotification(token, title, body) {
  const message = {
    notification: { title, body },
    token,
  };
  try {
    await admin.messaging().send(message);
    console.log("✅ Notification sent to", token);
  } catch (err) {
    console.error("❌ Error sending notification:", err);
  }
}

const sendnoti=()=>{
    cron.schedule("* * * * *", async () => {
  const now = new Date();
  const users = await User.find();
  for (const user of users) {
    const medicineTime = new Date(user.time);
    if (
      Math.abs(medicineTime.getTime() - now.getTime()) < 60000 &&
      user.fcmToken
    ) {
      await sendNotification(
        user.fcmToken,
        "Medicine Reminder 💊",
        `Time to take ${user.medicine}`
      );
    }
  }
});
}
export {sendnoti};