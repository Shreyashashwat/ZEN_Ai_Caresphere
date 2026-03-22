import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import { CaregiverLink } from "../model/caregiverLink.model.js";
import { sendFamilyInviteEmail } from "../utils/emailService.js";


export const inviteCaregiver = async (req, res) => {
    try {
        const { email, relationship, message } = req.body;
        const patientId = req.user.id;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Family member email is required",
            });
        }

        // Get the inviter's info for the email
        const inviter = await User.findById(patientId);
        if (!inviter) {
            return res.status(404).json({
                success: false,
                message: "Inviter not found",
            });
        }

        // Check if user is trying to invite themselves
        if (inviter.email.toLowerCase() === email.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: "You cannot invite yourself",
            });
        }

        const caregiver = await User.findOne({ email: email.toLowerCase() });

        // Check for existing invite (by email, since user might not exist yet)
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
            // User exists - create invite with caregiverId
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
        } else {
            // User doesn't exist - create invite by email only and send email
            await CaregiverLink.create({
                patientId,
                caregiverId: null, // Will be linked when they register
                caregiverEmail: email.toLowerCase(),
                relationship: relationship || "Family Member",
                message: message || "",
                status: "Pending",
            });

            // Send invitation email
            try {
                await sendFamilyInviteEmail({
                    toEmail: email.toLowerCase(),
                    inviterName: inviter.username,
                    inviterEmail: inviter.email,
                    relationship: relationship || "Family Member",
                    message: message,
                });

                return res.status(201).json({
                    success: true,
                    message: `Invitation email sent to ${email}! They'll need to create an account to accept.`,
                    emailSent: true,
                });
            } catch (emailError) {
                console.error("Email send failed:", emailError);
                // Invite was still created, just email failed
                return res.status(201).json({
                    success: true,
                    message: "Invitation created, but email notification failed. Please ask them to register manually.",
                    emailSent: false,
                });
            }
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
        const userId = req.user.id;

        // Get people I invited to my family circle (I am the patient)
        const myInvites = await CaregiverLink.find({
            patientId: userId,
        }).populate("caregiverId", "username email");

        // Get people who invited me to their family circle (I am the caregiver)
        const invitedToMe = await CaregiverLink.find({
            caregiverId: userId,
            status: "Active", // Only show accepted connections
        }).populate("patientId", "username email");

        // Format people I invited
        const formattedMyInvites = myInvites.map(link => ({
            id: link._id,
            memberId: link.caregiverId?._id || null,
            name: link.caregiverId?.username || (link.caregiverEmail ? "Awaiting Registration" : "Unknown"),
            email: link.caregiverId?.email || link.caregiverEmail || "",
            relationship: link.relationship || "Family Member",
            status: link.caregiverId ? link.status : "Invited",
            isEmailOnly: !link.caregiverId,
            direction: "invited", // I invited them
        }));

        // Format people who invited me
        const formattedInvitedToMe = invitedToMe.map(link => ({
            id: link._id,
            memberId: link.patientId?._id || null,
            name: link.patientId?.username || "Unknown",
            email: link.patientId?.email || "",
            relationship: link.relationship || "Family Member",
            status: link.status,
            isEmailOnly: false,
            direction: "accepted", // I accepted their invite
        }));

        // Combine both lists
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
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find invites by caregiverId OR by email (for newly registered users)
        const invites = await CaregiverLink.find({
            $or: [
                { caregiverId: req.user.id },
                { caregiverEmail: currentUser.email.toLowerCase(), caregiverId: null }
            ],
            status: "Pending",
        }).populate("patientId", "username email age gender");

        // Link any unlinked invites to this user
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
        const { patientId: targetUserId } = req.params;
        const currentUserId = req.user.id;

        const link = await CaregiverLink.findOne({
            status: "Active",
            $or: [
                // Caregiver viewing patient report
                { patientId: targetUserId, caregiverId: currentUserId },
                // Patient viewing caregiver report
                { patientId: currentUserId, caregiverId: targetUserId },
            ],
        });

        if (!link) {
            return res.status(403).json({ success: false, message: "Not authorized to view this family member" });
        }

        const Medicine = mongoose.model("Medicine");
        const Reminder = mongoose.model("Reminder");

        const medicines = await Medicine.find({ userId: targetUserId });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentHistory = await Reminder.find({
            userId: targetUserId,
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
