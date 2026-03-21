import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import { CaregiverLink } from "../model/caregiverLink.model.js";
import { sendFamilyInviteEmail } from "../utils/emailService.js";

const getCurrentUserId = (req) => req.user?._id || req.user?.id || req.user;

export const inviteCaregiver = async (req, res) => {
    try {
        const { email, relationship, message } = req.body;
        const patientId = getCurrentUserId(req);

        if (!patientId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Family member email is required",
            });
        }

        const inviter = await User.findById(patientId);
        if (!inviter) {
            return res.status(404).json({
                success: false,
                message: "Inviter not found",
            });
        }

        if (inviter.email.toLowerCase() === email.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: "You cannot invite yourself",
            });
        }

        const caregiver = await User.findOne({ email: email.toLowerCase() });

        const existingByEmail = await CaregiverLink.findOne({
            patientId,
            caregiverEmail: email.toLowerCase(),
        });

        if (existingByEmail) {
            return res.status(400).json({
                success: false,
                message: `Invite already sent to ${email} (status: ${existingByEmail.status})`,
            });
        }

        if (caregiver) {
            await CaregiverLink.create({
                patientId,
                caregiverId: caregiver._id,
                caregiverEmail: email.toLowerCase(),
                relationship: relationship || "Family Member",
                message: message || "",
                status: "Pending",
            });

            return res.status(201).json({
                success: true,
                message: "Family invitation sent successfully!",
            });
        }

        await CaregiverLink.create({
            patientId,
            caregiverId: null,
            caregiverEmail: email.toLowerCase(),
            relationship: relationship || "Family Member",
            message: message || "",
            status: "Pending",
        });

        try {
            await sendFamilyInviteEmail({
                toEmail: email.toLowerCase(),
                inviterName: inviter.username,
                inviterEmail: inviter.email,
                relationship: relationship || "Family Member",
                message,
            });

            return res.status(201).json({
                success: true,
                message: `Invitation email sent to ${email}! They'll need to create an account to accept.`,
                emailSent: true,
            });
        } catch (emailError) {
            console.error("Email send failed:", emailError);
            return res.status(201).json({
                success: true,
                message: "Invitation created, but email notification failed. Please ask them to register manually.",
                emailSent: false,
            });
        }
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
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const myInvites = await CaregiverLink.find({
            patientId: userId,
        }).populate("caregiverId", "username email");

        const invitedToMe = await CaregiverLink.find({
            caregiverId: userId,
            status: "Active",
        }).populate("patientId", "username email");

        const formattedMyInvites = myInvites.map(link => ({
            id: link._id,
            memberId: link.caregiverId?._id || null,
            name: link.caregiverId?.username || (link.caregiverEmail ? "Awaiting Registration" : "Unknown"),
            email: link.caregiverId?.email || link.caregiverEmail || "",
            relationship: link.relationship || "Family Member",
            status: link.caregiverId ? link.status : "Invited",
            isEmailOnly: !link.caregiverId,
            direction: "invited",
        }));

        const formattedInvitedToMe = invitedToMe.map(link => ({
            id: link._id,
            memberId: link.patientId?._id || null,
            name: link.patientId?.username || "Unknown",
            email: link.patientId?.email || "",
            relationship: link.relationship || "Family Member",
            status: link.status,
            isEmailOnly: false,
            direction: "accepted",
        }));

        const allFamilyMembers = [...formattedMyInvites, ...formattedInvitedToMe];

        return res.status(200).json({
            success: true,
            data: allFamilyMembers,
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
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const invites = await CaregiverLink.find({
            $or: [
                { caregiverId: userId },
                { caregiverEmail: currentUser.email.toLowerCase(), caregiverId: null },
            ],
            status: "Pending",
        }).populate("patientId", "username email age gender");

        for (const invite of invites) {
            if (!invite.caregiverId && invite.caregiverEmail === currentUser.email.toLowerCase()) {
                invite.caregiverId = currentUser._id;
                await invite.save();
            }
        }

        const formatted = invites.map(invite => ({
            id: invite._id,
            patientId: invite.patientId?._id,
            patientName: invite.patientId?.username,
            patientEmail: invite.patientId?.email,
            relationship: invite.relationship,
            message: invite.message,
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
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

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
            caregiverId: userId,
            status: "Pending",
        });

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: "Invite not found",
            });
        }

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
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const links = await CaregiverLink.find({
            caregiverId: userId,
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
        const caregiverId = getCurrentUserId(req);
        if (!caregiverId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { patientId } = req.params;

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
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { id } = req.params;

        const link = await CaregiverLink.findById(id);
        if (!link) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }

        if (link.patientId.toString() !== userId.toString() && link.caregiverId?.toString() !== userId.toString()) {
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
