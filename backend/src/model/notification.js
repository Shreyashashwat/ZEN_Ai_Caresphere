import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    type: {
      type: String,
      enum: ["email", "push", "browser"],
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
  },
  {
    timestamps: true, 
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
