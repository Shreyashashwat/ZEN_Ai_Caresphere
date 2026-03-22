import mongoose ,{Schema}from 'mongoose';
const calendarSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: String },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
  accessToken: { type: String },
  refreshToken: { type: String },
  expiryDate: { type: Date }
});

export const Calendar = mongoose.model("Calendar", calendarSchema);
