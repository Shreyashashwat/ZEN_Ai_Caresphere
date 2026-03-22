import { predictAdherenceRisk } from "../ml/predict.js";  // ✅ import your ML model
import { User } from "../model/user.model.js";
import admin from "../firebase/firebaseAdmin.js";


export const sendSmartRemindersForUser = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user || !user.fcmToken) return;

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // 🧠 Predict the adherence risk using ML
  const risk = await predictAdherenceRisk(hour, dayOfWeek, 0);

  // ✅ Only send if risk is high
  if (risk > 0.7) {
    const message = {
      notification: {
        title: "🤖 Smart Reminder",
        body: "⚠️ Looks like you often miss doses around this time. Please take your medicine soon!",
      },
      token: user.fcmToken,
    };

    try {
      await admin.messaging().send(message);
      console.log(`✅ Smart reminder sent to ${user._id} (risk=${risk.toFixed(2)})`);
    } catch (err) {
      console.error("❌ Smart reminder error:", err.message);
    }
  }
};
