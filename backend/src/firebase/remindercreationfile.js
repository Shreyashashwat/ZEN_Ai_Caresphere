import cron from "node-cron";

import { Medicine } from "../model/medicine.model.js";
import { Reminder } from "../model/reminderstatus.js";

let reminderCronStarted = false; // Prevent duplicate cron jobs

/**
 * 🕒 Reminder Creation Cron
 * TEST MODE: runs every 5 minutes
 */
const createRemindersCron = () => {
  if (reminderCronStarted) {
    console.log("⚠️ Reminder creation cron already running, skipping duplicate");
    return;
  }

  cron.schedule("*/5 * * * *", async () => {
    console.log("🌙 Reminder creation cron triggered:", new Date().toLocaleString());

    try {
      const medicines = await Medicine.find({ active: true });

      for (const med of medicines) {
        for (const t of med.time) {
          const [hours, minutes] = t.split(":").map(Number);

          const reminderTime = new Date();
          reminderTime.setHours(hours, minutes, 0, 0);

          // ⛔ Skip past times
          if (reminderTime <= new Date()) continue;

          const startOfDay = new Date(reminderTime);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(reminderTime);
          endOfDay.setHours(23, 59, 59, 999);

          const exists = await Reminder.findOne({
            medicineId: med._id,
            userId: med.userId,
            time: { $gte: startOfDay, $lte: endOfDay },
          });
          if (!exists) {
            await Reminder.create({
              medicineId: med._id,
              userId: med.userId,
              time: reminderTime,
              status: "pending",
              eventId: null,
            });
          }
        }
      }
    } catch (err) {
      console.error("❌ Error in reminder creation cron:", err);
    }
  });

  reminderCronStarted = true;
  console.log("✅ Reminder creation cron scheduled (TEST MODE: every 5 min)");
};

export { createRemindersCron };
