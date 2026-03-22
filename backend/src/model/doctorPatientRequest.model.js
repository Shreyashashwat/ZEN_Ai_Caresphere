import mongoose from "mongoose";

const doctorPatientRequestSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests
doctorPatientRequestSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });

export const DoctorPatientRequest = mongoose.model(
  "DoctorPatientRequest",
  doctorPatientRequestSchema
);

