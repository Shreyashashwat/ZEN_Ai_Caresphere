import  mongoose ,{Schema} from "mongoose"

const reminderStatusSchema = new mongoose.Schema({
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true },
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true },


  time: { type: Date, required: true },
  status: { type: String, enum: ["pending", "taken", "missed"], default: "pending" },
  userResponseTime: { type: Date },
});
export const Reminder=mongoose.model("Reminder",reminderStatusSchema)