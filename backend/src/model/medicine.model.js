import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, enum: ["daily", "weekly", "custom"], required: true },
  time: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  repeat: { type: String, default: "daily" },
  nextReminder: { type: Date },
   lastNotified:{type:Date},
  // Track snooze time for notifications
  snoozedUntil: { type: Date, default: null },

  statusHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reminder" }],
  createdAt: { type: Date, default: Date.now },
  takenCount: { type: Number, default: 0 },
  missedCount: { type: Number, default: 0 },
   googleEventIds: [String],
});

export const Medicine = mongoose.model("Medicine", medicineSchema);
