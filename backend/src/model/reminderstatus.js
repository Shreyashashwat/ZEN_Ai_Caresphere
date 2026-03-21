import  mongoose ,{Schema} from "mongoose"

const reminderStatusSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
 notified: {
  type: Boolean,
  default: false
},


  time: { type: Date, required: true },
  status: { type: String, enum: ["pending", "taken", "missed"], default: "pending" },
  
  userResponseTime: { type: Date },
  eventId: { type: String },
  autoAdjusted: { type: Boolean, default: false },
  processedMissed: { type: Boolean, default: false },
}, { timestamps: true });
export const Reminder=mongoose.model("Reminder",reminderStatusSchema)