import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import { sendnoti } from "./firebase/SendNotification.js";
import cron from "node-cron";
import { User } from "./model/user.model.js";
import { trainAdherenceModel } from "./ml/train.js";
import { generateWeeklyInsightsForAllUsers } from "./controllers/user.controller.js";
dotenv.config({ path: "./.env" });


cron.schedule("0 0 * * 0", async () => {
    console.log("📊 Weekly retraining job started...");
    try {
        await trainAdherenceModel();
        console.log("✅ Model retraining complete!");
    } catch (err) {
        console.error("❌ Error during retraining:", err);
    }
});

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
        console.log("🟢 MongoDB connected");

        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`✅ Server is running at ${PORT}`);
            sendnoti();

            // Run ML training and insights generation in the background (non-blocking)
            console.log("🔄 Starting background ML training and insights generation...");
            Promise.all([
                trainAdherenceModel().catch(err => console.error("❌ ML training failed:", err)),
                generateWeeklyInsightsForAllUsers().catch(err => console.error("❌ Insights generation failed:", err)),
            ]).then(() => {
                console.log("✅ Background tasks completed");
            });
    });
    })
    .catch((err) => {
        console.log(`❌ DB connection error: ${err}`);
    });
