import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { Appointment } from "../model/appointment.model.js";
import redisClient from "../configs/redisClient.js"; 

const CACHE_TTL = 3600; 

const getWeekStats = asyncHandler(async (req, res) => {
    const userId = req.user._id?.toString() || req.user.id;
    if (!userId) throw new ApiError(400, "User ID missing");

    const cacheKey = `stats:week:${userId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), "Weekly stats fetched from cache"));
    }

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const reminders = await Reminder.find({ userId, time: { $gte: startOfWeek } });

    let taken = 0, missed = 0, pending = 0;
    reminders.forEach((r) => {
        if (r.status === "taken") taken++;
        else if (r.status === "missed") missed++;
        else pending++;
    });

    const totalResolved = taken + missed;
    const adherencePercent = totalResolved > 0 ? Math.round((taken / totalResolved) * 100) : 0;
    const result = { taken, missed, pending, totalResolved, adherencePercent };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));

    return res.status(200).json(new ApiResponse(200, result, "Weekly stats fetched successfully"));
});

const getMedicineAdherence = asyncHandler(async (req, res) => {
    const userId = req.user._id?.toString() || req.user.id;
    const { medicineId } = req.params;
    const cacheKey = `adherence:${userId}:${medicineId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), "Adherence fetched from cache"));
    }

    const medicine = await Medicine.findOne({ _id: medicineId, userId });
    if (!medicine) throw new ApiError(404, "Medicine not found");

    const reminders = await Reminder.find({ userId, medicineId });

    let taken = 0, missed = 0, pending = 0;
    reminders.forEach((r) => {
        if (r.status === "taken") taken++;
        else if (r.status === "missed") missed++;
        else pending++;
    });

    const result = {
        medicineName: medicine.medicineName,
        taken, missed, pending,
        totalResolved: taken + missed,
        adherencePercent: (taken + missed) > 0 ? Math.round((taken / (taken + missed)) * 100) : 0
    };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));

    return res.status(200).json(new ApiResponse(200, result, "Medicine adherence fetched successfully"));
});

const getAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id?.toString() || req.user.id;
    const cacheKey = `appointments:list:${userId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), "Appointments fetched from cache"));
    }

    const appointments = await Appointment.find({ patientId: userId })
        .populate("doctorId", "username specialization")
        .sort({ appointmentDate: -1 });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(appointments)); 

    return res.status(200).json(new ApiResponse(200, appointments, "Appointments fetched successfully"));
});

const getUpcomingAppointment = asyncHandler(async (req, res) => {
    const userId = req.user._id?.toString() || req.user.id;
    const cacheKey = `appointments:upcoming:${userId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), "Upcoming appointment from cache"));
    }

    const appointment = await Appointment.findOne({
        patientId: userId,
        appointmentDate: { $gte: new Date() },
        status: { $ne: "CANCELLED" },
    })
    .populate("doctorId", "username specialization")
    .sort({ appointmentDate: 1 });

    const result = appointment || null;
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result)); 

    return res.status(200).json(
        new ApiResponse(200, result, result ? "Upcoming appointment fetched" : "No upcoming appointments")
    );
});

export { getWeekStats, getMedicineAdherence, getAppointments, getUpcomingAppointment };