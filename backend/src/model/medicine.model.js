import mongoose ,{Schema}from 'mongoose';


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
  statusHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "ReminderStatus" }],
  createdAt: { type: Date, default: Date.now },
  takenCount: { type: Number, default: 0 },
missedCount: { type: Number, default: 0 },

});
export const Medicine=mongoose.model("Medicine",medicineSchema)

