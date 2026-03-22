import mongoose from "mongoose";

const dailyHealthNoteSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    noteDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export const DailyHealthNote = mongoose.model("DailyHealthNote", dailyHealthNoteSchema);
