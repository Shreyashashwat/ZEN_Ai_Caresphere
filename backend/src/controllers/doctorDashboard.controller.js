
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { DoctorPatientRequest } from "../model/doctorPatientRequest.model.js";
import Doctor from "../model/doctor.js";

const getDoctorDashboard = asyncHandler(async (req, res) => {
    const doctorId = req.user;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    const acceptedRequests = await DoctorPatientRequest.find({
        doctorId,
        status: "ACCEPTED",
    }).populate("patientId", "username email age gender");

    const patientIds = acceptedRequests.map((req) => {
        const patient = req.patientId;
        if (patient && patient._id) {
            return patient._id;
        }
        return patient;
    }).filter(Boolean); 
    if (patientIds.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    stats: {
                        totalPatients: 0,
                        missedToday: 0,
                        takenToday: 0,
                        pendingToday: 0,
                    },
                    todaySchedule: [],
                    patientList: [],
                },
                "Doctor dashboard data fetched successfully (no patients)"
            )
        );
    }

    // Get patients data - ONLY accepted patients
    const patients = await User.find({ _id: { $in: patientIds } })
        .select("-password");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayReminders, allRecentReminders] = await Promise.all([
        Reminder.find({
            userId: { $in: patientIds },
            time: { $gte: todayStart, $lte: todayEnd }
        }).populate("userId", "username").populate("medicineId", "medicineName"),

        Reminder.find({
            userId: { $in: patientIds },
            time: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
    ]);

    const stats = {
        totalPatients: patients.length,
        missedToday: todayReminders.filter(r => r.status === "missed").length,
        takenToday: todayReminders.filter(r => r.status === "taken").length,
        pendingToday: todayReminders.filter(r => r.status === "pending").length,
    };

    const patientAdherence = patients.map(patient => {
        const pReminders = allRecentReminders.filter(r => r.userId.toString() === patient._id.toString());
        const missedCount = pReminders.filter(r => r.status === "missed").length;
        
        return {
            patientName: patient.username,
            patientId: patient._id,
            missedCount,
            status: missedCount > 3 ? "Critical" : "Stable"
        };
    });

    return res.status(200).json(
        new ApiResponse(200, {
            stats,
            todaySchedule: todayReminders,
            patientList: patientAdherence,
            // doctorInfo: {
            //     username: doctor.username,
            //     doctorCode: doctor.doctorCode
            // }
        }, "Doctor dashboard data fetched successfully")
    );
});

export { getDoctorDashboard };