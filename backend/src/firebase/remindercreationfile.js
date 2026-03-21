import cron from "node-cron";

import { addReminder } from "../controllers/reminder.controller.js";
import { Medicine } from "../model/medicine.model.js";
/**
 * 🕒 Reminder Creation Cron
 * TEST MODE: runs every 5 minutes
 */
const createRemindersCron = () => {
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

          await addReminder({
            medicineId: med._id,
            time: reminderTime,
          });
        }
      }
    } catch (err) {
      console.error("❌ Error in reminder creation cron:", err);
    }
  });

  console.log("🕐 Reminder creation cron scheduled (TEST MODE: every 5 min).");
};

export { createRemindersCron };
