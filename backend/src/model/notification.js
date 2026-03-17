import  mongoose ,{Schema} from "mongoose"
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Medication" },
  type: { type: String, enum: ["email", "push", "browser"], required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["sent", "failed"], default: "sent" }
});

export const Notification=mongoose.model(("Notification",notificationSchema))