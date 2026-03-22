import mongoose from "mongoose";

const prescribedMedicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const appointmentReportSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    medicines: {
      type: [prescribedMedicineSchema],
      default: [],
    },
    reviewNotes: {
      type: String,
      default: "",
      trim: true,
    },
    problem: {
      type: String,
      default: "",
      trim: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const AppointmentReport = mongoose.model("AppointmentReport", appointmentReportSchema);