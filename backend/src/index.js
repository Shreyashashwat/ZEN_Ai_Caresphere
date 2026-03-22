import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import { sendnoti } from "./firebase/SendNotification.js";
import cron from "node-cron";
import { User } from "./model/user.model.js";
import { trainAdherenceModel } from "./ml/train.js";
import { generateWeeklyInsightsForAllUsers } from "./controllers/user.controller.js";
import { Reminder } from "./model/reminderstatus.js";
dotenv.config({ path: "./.env" });

/**
 * One-time startup cleanup: remove duplicate Reminder documents.
 * Keeps the best record per (medicineId, userId, day) and deletes the rest.
 */
async function cleanupDuplicateReminders() {
  try {
    console.log("🧹 Running duplicate reminder cleanup...");

    const groups = await Reminder.aggregate([
      {
        $group: {
          _id: {
            medicineId: "$medicineId",
            userId: "$userId",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$time" } },
          },
          docs: { $push: { id: "$_id", status: "$status", time: "$time" } },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    let deletedTotal = 0;

    for (const group of groups) {
      const docs = group.docs;

      // Prefer: taken > missed > pending; among same status, keep latest
      const priority = { taken: 0, missed: 1, pending: 2 };
      docs.sort((a, b) => {
        const sp = (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
        if (sp !== 0) return sp;
        return new Date(b.time) - new Date(a.time);
      });

      const [, ...toDelete] = docs;
      const idsToDelete = toDelete.map((d) => d.id);

      if (idsToDelete.length > 0) {
        await Reminder.deleteMany({ _id: { $in: idsToDelete } });
        deletedTotal += idsToDelete.length;
      }
    }

    console.log(`✅ Duplicate cleanup done. Removed ${deletedTotal} duplicate reminder(s).`);
  } catch (err) {
    console.error("❌ Duplicate reminder cleanup failed:", err.message);
  }
}


cron.schedule("0 0 * * 0", async () => {
console.log("📊 Weekly retraining job started...");
  try {
    await trainAdherenceModel();
    console.log("✅ Model retraining complete!");
  } catch (err) {
    console.error("❌ Error during retraining:", err);
  }
});;
cron.schedule("0 0 * * 0", async () => {
  console.log("🧠 Weekly health insights generation started...");
  try {
    await generateWeeklyInsightsForAllUsers();
    console.log("✅ Weekly health insights generated");
  } catch (err) {
    console.error("❌ Health insights cron failed:", err);
  }
});
connectDB()
  .then(async () => {
    console.log("🟢 MongoDB connected, starting one-time ML training...");

    // 🧹 Clean up duplicate reminders from old buggy cron runs
    await cleanupDuplicateReminders();

    // 🔥 TEMPORARY: run training once
    await trainAdherenceModel()
    await generateWeeklyInsightsForAllUsers()
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`✅ Server is running at ${PORT}`);
      sendnoti();
    });
  })
  .catch((err) => {
    console.log(`❌ DB connection error: ${err}`);
  });
