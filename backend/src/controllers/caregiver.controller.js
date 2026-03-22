import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import { CaregiverLink } from "../model/caregiverLink.model.js";

import { Queue } from "bullmq";
import redisClient from "../configs/redisClient.js";

const taskQueue = new Queue("task-queue", {
    connection: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT) || 6379,
    }
});


const clearFamilyCache = async (userId) => {
    if (!userId) return;
    const keys = [
        `family:list:${userId}`,
        `family:assigned:${userId}`,
        `family:pending:${userId}`,
        `report:${userId}`
    ];
    try {
        for (const key of keys) {
            await redisClient.del(key);
        }
    } catch (err) {
        console.error("Redis Cache Clear Error:", err);
    }
};

export const inviteCaregiver = async (req, res) => {
    try {
        const { email, relationship, message } = req.body;
        const patientId = req.user.id;

        if (!email) {
            return res.status(400).json({ success: false, message: "Family member email is required" });
        }

        const inviter = await User.findById(patientId);
        if (!inviter) {
            return res.status(404).json({ success: false, message: "Inviter not found" });
        }

        if (inviter.email.toLowerCase() === email.toLowerCase()) {
            return res.status(400).json({ success: false, message: "You cannot invite yourself" });
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

        const newInvite = await CaregiverLink.create({
            patientId,
            caregiverId: caregiver ? caregiver._id : null,
            caregiverEmail: email.toLowerCase(),
            relationship: relationship || "Family Member",
            message: message || "",
            status: "Pending",
        });


        await clearFamilyCache(patientId);

        await taskQueue.add("sendEmail", {
            userId: caregiver ? caregiver._id : null,
            title: "CareSphere Family Invitation",
            extraMessage: `${inviter.username} has invited you to join their family circle as a ${relationship || 'Family Member'}.`,
            description: message,
            sendEmail: true,
            toEmail: email.toLowerCase(), 
            inviterName: inviter.username
        });

        return res.status(201).json({
            success: true,
            message: caregiver 
                ? "Invitation sent to registered user!" 
                : `Invitation queued for ${email}. They will receive an email shortly.`,
            inviteId: newInvite._id
        });
    } catch (error) {
        console.error("inviteCaregiver error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getMyCaregivers = async (req, res) => {
    try {
        const userId = req.user.id;
        const cacheKey = `family:list:${userId}`;

      
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached) });

        
        const myInvites = await CaregiverLink.find({ patientId: userId }).populate("caregiverId", "username email");
        const invitedToMe = await CaregiverLink.find({ caregiverId: userId, status: "Active" }).populate("patientId", "username email");

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

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(allFamilyMembers));

        return res.status(200).json({ success: true, data: allFamilyMembers });
    } catch (error) {
        console.error("getMyCaregivers error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getPendingInvites = async (req, res) => {
    try {
        const userId = req.user.id;
        const cacheKey = `family:pending:${userId}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached) });

        const currentUser = await User.findById(userId);
        if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

        const invites = await CaregiverLink.find({
            $or: [
                { caregiverId: userId },
                { caregiverEmail: currentUser.email.toLowerCase(), caregiverId: null }
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

        await redisClient.setEx(cacheKey, 1800, JSON.stringify(formatted)); // 30 min cache

        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error("getPendingInvites error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const respondToInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        const caregiverId = req.user.id;

        if (!["accept", "reject"].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid action" });
        }

        const invite = await CaregiverLink.findOne({ _id: id, caregiverId, status: "Pending" });

        if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

        invite.status = action === "accept" ? "Active" : "Rejected";
        await invite.save();


        await clearFamilyCache(caregiverId);
        await clearFamilyCache(invite.patientId.toString());

        return res.status(200).json({ success: true, message: `Invite ${invite.status}` });
    } catch (error) {
        console.error("respondToInvite error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getAssignedPatients = async (req, res) => {
    try {
        const userId = req.user.id;
        const cacheKey = `family:assigned:${userId}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached) });

        const links = await CaregiverLink.find({ caregiverId: userId, status: "Active" })
            .populate("patientId", "username email age gender");

        const patients = links.map(link => ({
            id: link.patientId._id,
            name: link.patientId.username,
            email: link.patientId.email,
            age: link.patientId.age,
            gender: link.patientId.gender,
            linkId: link._id,
        }));

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(patients));

        return res.status(200).json({ success: true, data: patients });
    } catch (error) {
        console.error("getAssignedPatients error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getPatientDetails = async (req, res) => {
    try {
        const { patientId: targetUserId } = req.params;
        const currentUserId = req.user.id;
        const cacheKey = `report:${targetUserId}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached) });

        const link = await CaregiverLink.findOne({
            status: "Active",
            $or: [
                { patientId: targetUserId, caregiverId: currentUserId },
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

        const taken = recentHistory.filter(r => r.status === 'taken').length;
        const adherence = recentHistory.length > 0 ? Math.round((taken / recentHistory.length) * 100) : 0;
        
        const result = { medicines, history: recentHistory, adherence };

        await redisClient.setEx(cacheKey, 600, JSON.stringify(result));

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching patient details:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const removeCaregiver = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await CaregiverLink.findById(id);
        if (!link) return res.status(404).json({ success: false, message: "Link not found" });

        if (link.patientId.toString() !== req.user.id && link.caregiverId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const pId = link.patientId.toString();
        const cId = link.caregiverId?.toString();

        await CaregiverLink.findByIdAndDelete(id);


        await clearFamilyCache(pId);
        if (cId) await clearFamilyCache(cId);

        return res.status(200).json({ success: true, message: "Caregiver removed" });
    } catch (error) {
        console.error("removeCaregiver error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};