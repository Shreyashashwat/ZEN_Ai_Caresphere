import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { Appointment } from "../model/appointment.model.js";


const getWeekStats = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  if (!userId) throw new ApiError(400, "User ID missing");

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const reminders = await Reminder.find({
    userId,
    time: { $gte: startOfWeek },
  });

  let taken = 0;
  let missed = 0;
  let pending = 0;

  reminders.forEach((r) => {
    if (r.status === "taken") taken++;
    else if (r.status === "missed") missed++;
    else pending++;
  });

  const totalResolved = taken + missed;
  const adherencePercent =
    totalResolved > 0 ? Math.round((taken / totalResolved) * 100) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      { taken, missed, pending, totalResolved, adherencePercent },
      "Weekly stats fetched successfully"
    )
  );
});


const getMedicineAdherence = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { medicineId } = req.params;

  if (!userId) throw new ApiError(400, "User ID missing");

  const medicine = await Medicine.findOne({ _id: medicineId, userId });
  if (!medicine) throw new ApiError(404, "Medicine not found or not authorized");

  const reminders = await Reminder.find({ userId, medicineId });

  let taken = 0;
  let missed = 0;
  let pending = 0;

  reminders.forEach((r) => {
    if (r.status === "taken") taken++;
    else if (r.status === "missed") missed++;
    else pending++;
  });

  const totalResolved = taken + missed;
  const adherencePercent =
    totalResolved > 0 ? Math.round((taken / totalResolved) * 100) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        medicineName: medicine.medicineName,
        taken,
        missed,
        pending,
        totalResolved,
        adherencePercent,
      },
      "Medicine adherence fetched successfully"
    )
  );
});


const getAppointments = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  if (!userId) throw new ApiError(400, "User ID missing");

  const appointments = await Appointment.find({ patientId: userId })
    .populate("doctorId", "username specialization")
    .sort({ appointmentDate: -1 });

  return res.status(200).json(
    new ApiResponse(200, appointments, "Appointments fetched successfully")
  );
});

const getUpcomingAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  if (!userId) throw new ApiError(400, "User ID missing");

  const appointment = await Appointment.findOne({
    patientId: userId,
    appointmentDate: { $gte: new Date() },
    status: { $ne: "CANCELLED" },
  })
    .populate("doctorId", "username  specialization")
    .sort({ appointmentDate: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      appointment || null,
      appointment
        ? "Upcoming appointment fetched successfully"
        : "No upcoming appointments"
    )
  );
});

export {
  getWeekStats,
  getMedicineAdherence,
  getAppointments,
  getUpcomingAppointment,
};