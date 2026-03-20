import mongoose from "mongoose";

const caregiverLinkSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        caregiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // This will be null until an actual user accepts the invite or if we link by email immediately
        },
        caregiverEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        relationship: {
            type: String,
            default: "Family Member",
        },
        message: {
            type: String,
        },
        status: {
            type: String,
            enum: ["Pending", "Active", "Rejected"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

export const CaregiverLink = mongoose.model("CaregiverLink", caregiverLinkSchema);
