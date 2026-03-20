import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import { CaregiverLink } from "../model/caregiverLink.model.js";


export const inviteCaregiver = async (req, res) => {
    try {
        const { email } = req.body;
        const patientId = req.user.id;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Caregiver email is required",
            });
        }

        const caregiver = await User.findOne({ email: email.toLowerCase() });
        if (!caregiver) {
            return res.status(404).json({
                success: false,
                message: "Caregiver user not found",
            });
        }

        if (caregiver._id.toString() === patientId) {
            return res.status(400).json({
                success: false,
                message: "You cannot invite yourself",
            });
        }

        const existing = await CaregiverLink.findOne({
            patientId,
            caregiverId: caregiver._id,
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Invite already exists (status: ${existing.status})`,
            });
        }

        await CaregiverLink.create({
            patientId,
            caregiverId: caregiver._id,
            status: "pending",
        });

        return res.status(201).json({
            success: true,
            message: "Caregiver invitation sent",
        });
    } catch (error) {
        console.error("inviteCaregiver error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const getMyCaregivers = async (req, res) => {
    try {
        const caregivers = await CaregiverLink.find({
            patientId: req.user.id,
        }).populate("caregiverId", "username email");

        const formatted = caregivers.map(link => ({
            id: link._id,
            caregiverId: link.caregiverId?._id || null,
            name: link.caregiverId?.username || "Unknown",
            email: link.caregiverId?.email || "",
            status: link.status,
        }));

        return res.status(200).json({
            success: true,
            caregivers: formatted,
        });
    } catch (error) {
        console.error("getMyCaregivers error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};





export const getPendingInvites = async (req, res) => {
    try {
        const invites = await CaregiverLink.find({
            caregiverId: req.user.id,
            status: "pending",
        }).populate("patientId", "username email age gender");

        const formatted = invites.map(invite => ({
            id: invite._id,
            patientId: invite.patientId?._id,
            patientName: invite.patientId?.username,
            patientEmail: invite.patientId?.email,
            createdAt: invite.createdAt,
        }));

        return res.status(200).json({
            success: true,
            invites: formatted,
            data: formatted
        });
    } catch (error) {
        console.error("getPendingInvites error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const respondToInvite = async (req, res) => {
    try {
        const { id } = req.params; 
        const { action } = req.body;

        if (!["accept", "reject"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action",
            });
        }

        const invite = await CaregiverLink.findOne({
            _id: id,
            caregiverId: req.user.id,
            status: "pending",
        });

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: "Invite not found",
            });
        }

        invite.status = action === "accept" ? "active" : "rejected";
        
        invite.status = action === "accept" ? "Active" : "Rejected";

        await invite.save();

        return res.status(200).json({
            success: true,
            message: `Invite ${invite.status}`,
        });
    } catch (error) {
        console.error("respondToInvite error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const getAssignedPatients = async (req, res) => {
    try {
        const links = await CaregiverLink.find({
            caregiverId: req.user.id,
            status: "Active", 
        }).populate("patientId", "username email age gender");

        const patients = links.map(link => ({
            id: link.patientId._id,
            name: link.patientId.username,
            email: link.patientId.email,
            age: link.patientId.age,
            gender: link.patientId.gender,
            linkId: link._id,
        }));

        return res.status(200).json({
            success: true,
            data: patients,
        });
    } catch (error) {
        console.error("getAssignedPatients error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const getPatientDetails = async (req, res) => {
    try {
        const { patientId } = req.params;
        const caregiverId = req.user.id;

        const link = await CaregiverLink.findOne({
            patientId,
            caregiverId,
            status: "Active"
        });

        if (!link) {
            return res.status(403).json({ success: false, message: "Not authorized to view this patient" });
        }

        const Medicine = mongoose.model("Medicine");
        const Reminder = mongoose.model("Reminder");

        const medicines = await Medicine.find({ userId: patientId });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentHistory = await Reminder.find({
            userId: patientId,
            time: { $gte: sevenDaysAgo }
        }).sort({ time: -1 }).limit(50);

        const total = recentHistory.length;
        const taken = recentHistory.filter(r => r.status === 'taken').length;
        const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

        return res.status(200).json({
            success: true,
            data: {
                medicines,
                history: recentHistory,
                adherence
            }
        });

    } catch (error) {
        console.error("Error fetching patient details:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


//  * ================================
export const removeCaregiver = async (req, res) => {
    try {
        const { id } = req.params; 
        
        const link = await CaregiverLink.findById(id);
        if (!link) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }

        // Check authorization
        if (link.patientId.toString() !== req.user.id && link.caregiverId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        await CaregiverLink.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Caregiver removed",
        });
    } catch (error) {
        console.error("removeCaregiver error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
