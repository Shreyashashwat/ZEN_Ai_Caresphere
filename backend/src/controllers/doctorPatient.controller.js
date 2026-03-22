import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DoctorPatientRequest } from "../model/doctorPatientRequest.model.js";
import { User } from "../model/user.model.js";
import Doctor from "../model/doctor.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { Appointment } from "../model/appointment.model.js";
import { AppointmentReport } from "../model/appointmentReport.model.js";
import { DailyHealthNote } from "../model/dailyHealthNote.model.js";
import mongoose from "mongoose";
import redisClient from "../configs/redisClient.js"; 

// ─── Send Doctor Request────────────────────────
const sendDoctorRequest = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { doctorId } = req.body;

  if (!doctorId) throw new ApiError(400, "Doctor ID is required");

  const patient = await User.findById(patientId);
  if (!patient) throw new ApiError(404, "Patient not found");

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const existingRequest = await DoctorPatientRequest.findOne({ patientId, doctorId });
  if (existingRequest) throw new ApiError(400, "Request already sent to this doctor");

  const request = await DoctorPatientRequest.create({ patientId, doctorId, status: "PENDING" });

  await redisClient.del(`pending_requests:${doctorId}`);
  await redisClient.del(`patient_requests:${patientId}`);

  const populatedRequest = await DoctorPatientRequest.findById(request._id)
    .populate("patientId", "username email")
    .populate("doctorId", "username email code");

  return res.status(201).json(new ApiResponse(201, populatedRequest, "Request sent to doctor successfully"));
});

// ─── Get Pending Requests (Doctor) ────────────────────────────────────────────
const getPendingRequests = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const cacheKey = `pending_requests:${doctorId}`;


  const cached = await redisClient.get(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "Pending requests fetched from cache"));

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const pendingRequests = await DoctorPatientRequest.find({ doctorId, status: "PENDING" })
    .populate("patientId", "username email age gender")
    .sort({ createdAt: -1 });

 
  await redisClient.setEx(cacheKey, 1800, JSON.stringify(pendingRequests));

  return res.status(200).json(new ApiResponse(200, pendingRequests, "Pending requests fetched successfully"));
});

// ─── Accept Request (Doctor) ──────────────────────────────────────────────────
const acceptRequest = asyncHandler(async (req, res) => {
  const loggedInDoctorId = req.user._id;
  const { id } = req.params;

  const request = await DoctorPatientRequest.findById(id);
  if (!request) throw new ApiError(404, "Request not found");

  if (request.doctorId.toString() !== loggedInDoctorId.toString()) {
    throw new ApiError(403, "Unauthorized: This request does not belong to you");
  }

  request.status = "ACCEPTED";
  await request.save();


  await redisClient.del(`doctor_dashboard:${loggedInDoctorId}`);
  await redisClient.del(`pending_requests:${loggedInDoctorId}`);
  await redisClient.del(`patient_requests:${request.patientId}`);

  const populatedRequest = await DoctorPatientRequest.findById(request._id)
    .populate("patientId", "username email age gender")
    .populate("doctorId", "username email code");

  return res.status(200).json(new ApiResponse(200, populatedRequest, "Request accepted successfully"));
});

// ─── Reject Request (Doctor) ──────────────────────────────────────────────────
const rejectRequest = asyncHandler(async (req, res) => {
  const loggedInDoctorId = req.user._id;
  const { id } = req.params;

  const request = await DoctorPatientRequest.findById(id);
  if (!request) throw new ApiError(404, "Request not found");

  if (!request.doctorId.equals(loggedInDoctorId)) {
    throw new ApiError(403, "Unauthorized: This request does not belong to you");
  }

  request.status = "REJECTED";
  await request.save();

  await redisClient.del(`pending_requests:${loggedInDoctorId}`);
  await redisClient.del(`patient_requests:${request.patientId}`);

  const populatedRequest = await DoctorPatientRequest.findById(request._id)
    .populate("patientId", "username email age gender")
    .populate("doctorId", "username email code");

  return res.status(200).json(new ApiResponse(200, populatedRequest, "Request rejected successfully"));
});

// ─── Doctor Dashboard ─────────────────────────────────────────────────────────
const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const cacheKey = `doctor_dashboard:${doctorId}`;

 
  const cached = await redisClient.get(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "Doctor dashboard data fetched from cache"));

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const acceptedRequests = await DoctorPatientRequest.find({
    doctorId,
    status: "ACCEPTED",
  }).populate("patientId", "username email age gender");

  const patientIds = acceptedRequests
    .map((req) => (req.patientId && req.patientId._id ? req.patientId._id : req.patientId))
    .filter(Boolean);

  if (patientIds.length === 0) {
    const emptyState = { stats: { totalPatients: 0, missedToday: 0, takenToday: 0, pendingToday: 0 }, todaySchedule: [], patientList: [] };
    await redisClient.setEx(cacheKey, 600, JSON.stringify(emptyState));
    return res.status(200).json(new ApiResponse(200, emptyState, "Doctor dashboard (no patients)"));
  }

  const patients = await User.find({ _id: { $in: patientIds } }).select("-password");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayReminders, allRecentReminders] = await Promise.all([
    Reminder.find({ userId: { $in: patientIds }, time: { $gte: todayStart, $lte: todayEnd } })
      .populate("userId", "username")
      .populate("medicineId", "medicineName"),
    Reminder.find({ userId: { $in: patientIds }, time: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
  ]);

  const stats = {
    totalPatients: patients.length,
    missedToday: todayReminders.filter((r) => r.status === "missed").length,
    takenToday: todayReminders.filter((r) => r.status === "taken").length,
    pendingToday: todayReminders.filter((r) => r.status === "pending").length,
  };

  const patientAdherence = patients.map((patient) => {
    const pReminders = allRecentReminders.filter((r) => r.userId.toString() === patient._id.toString());
    const missedCount = pReminders.filter((r) => r.status === "missed").length;
    return {
      patientName: patient.username,
      patientId: patient._id,
      email: patient.email,
      age: patient.age,
      gender: patient.gender,
      missedCount,
      status: missedCount > 3 ? "Critical" : "Stable",
      todayMedicines: todayReminders.filter((r) => (r.userId._id || r.userId).toString() === patient._id.toString()),
    };
  });

  const responseData = { stats, todaySchedule: todayReminders, patientList: patientAdherence };
  
  // SET CACHE (10 mins)
  await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData));

  return res.status(200).json(new ApiResponse(200, responseData, "Doctor dashboard data fetched successfully"));
});

// ─── Get All Doctors ──────────────────────────────────────────────────────────
const getAllDoctors = asyncHandler(async (req, res) => {
  const cacheKey = "all_doctors_list";
  const cached = await redisClient.get(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "Doctors fetched from cache"));

  const doctors = await Doctor.find({}).select("-password").sort({ username: 1 });
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(doctors)); // Cache for 1 hour

  return res.status(200).json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});

// ─── Get Patient Request Status ───────────────────────────────────────────────
const getPatientRequestStatus = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { doctorId } = req.params;

  const request = await DoctorPatientRequest.findOne({ patientId, doctorId })
    .populate("patientId", "username email")
    .populate("doctorId", "username email code");

  if (!request) return res.status(200).json(new ApiResponse(200, { status: "NONE" }, "No request found"));
  return res.status(200).json(new ApiResponse(200, request, "Request status fetched successfully"));
});

// ─── Get Patient Requests ─────────────────────────────────────────────────────
const getPatientRequests = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const cacheKey = `patient_requests:${patientId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "Patient requests from cache"));

  const requests = await DoctorPatientRequest.find({ patientId })
    .populate("doctorId", "username email code")
    .sort({ createdAt: -1 });

  await redisClient.setEx(cacheKey, 1800, JSON.stringify(requests));
  return res.status(200).json(new ApiResponse(200, requests, "Patient requests fetched successfully"));
});

// ─── Schedule Appointment ─────────────────────────────────────────────────────
const scheduleAppointment = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { doctorId, appointmentDate, problem } = req.body;

  if (!doctorId || !appointmentDate || !problem) throw new ApiError(400, "All fields are required");
  if (!mongoose.Types.ObjectId.isValid(doctorId)) throw new ApiError(400, "Invalid doctorId");

  const doctorExists = await Doctor.findById(doctorId);
  if (!doctorExists) throw new ApiError(404, "Doctor not found");

  const appointment = await Appointment.create({ patientId, doctorId, appointmentDate, problem, status: "PENDING" });


  await redisClient.del(`doctor_appointments:${doctorId}`);
  await redisClient.del(`patient_appointments:${patientId}`);

  return res.status(201).json(new ApiResponse(201, appointment, "Appointment request sent to doctor"));
});


export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const cacheKey = `doctor_appointments:${doctorId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached), source: "cache" });

    const appointments = await Appointment.find({ doctorId })
      .populate("patientId", "username email")
      .sort({ appointmentDate: 1 });

    await redisClient.setEx(cacheKey, 1800, JSON.stringify(appointments));
    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  try {
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status }, { new: true });
    
   
    await redisClient.del(`doctor_appointments:${appointment.doctorId}`);
    await redisClient.del(`patient_appointments:${appointment.patientId}`);

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};


export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user._id || req.user;
    const cacheKey = `patient_appointments:${patientId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached), source: "cache" });

    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "username email")
      .sort({ appointmentDate: 1 });

    await redisClient.setEx(cacheKey, 1800, JSON.stringify(appointments));
    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch patient appointments" });
  }
};



const sendAppointmentReport = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;
  const { appointmentId } = req.params;
  const { patientId, medicines, reviewNotes, reportDate } = req.body;

  if (req.user?.role !== "doctor") {
    throw new ApiError(403, "Only doctors can send appointment reports");
  }

  if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new ApiError(400, "Valid appointmentId is required");
  }

  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, "Valid patientId is required");
  }

  if (!Array.isArray(medicines) || medicines.length === 0) {
    throw new ApiError(400, "At least one prescribed medicine is required");
  }

  if (!reviewNotes || !String(reviewNotes).trim()) {
    throw new ApiError(400, "Doctor review notes are required");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.doctorId.toString() !== doctorId.toString()) {
    throw new ApiError(403, "You can only create reports for your own appointments");
  }

  if (appointment.patientId.toString() !== String(patientId)) {
    throw new ApiError(400, "patientId does not match this appointment");
  }

  if (appointment.status !== "COMPLETED") {
    throw new ApiError(400, "Report can be sent only after appointment is completed");
  }

  if (appointment.reportId) {
    throw new ApiError(409, "Report already exists for this appointment");
  }

  const normalizedMedicines = medicines.map((med) => ({
    medicineName: String(med?.medicineName || "").trim(),
    dosage: String(med?.dosage || "").trim(),
    frequency: String(med?.frequency || "").trim(),
  }));

  const hasInvalidMedicine = normalizedMedicines.some(
    (med) => !med.medicineName || !med.dosage || !med.frequency
  );
  if (hasInvalidMedicine) {
    throw new ApiError(400, "Each medicine must include medicineName, dosage and frequency");
  }

  const createdReport = await AppointmentReport.create({
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    doctorId,
    medicines: normalizedMedicines,
    reviewNotes: String(reviewNotes).trim(),
    problem: appointment.problem || "",
    reportDate: reportDate ? new Date(reportDate) : new Date(),
  });

  appointment.reportId = createdReport._id;
  await appointment.save();

  const report = await AppointmentReport.findById(createdReport._id)
    .populate("patientId", "username email")
    .populate("doctorId", "username email code")
    .populate("appointmentId", "appointmentDate problem status");

  return res
    .status(201)
    .json(new ApiResponse(201, report, "Appointment report sent successfully"));
});



const getMyReports = asyncHandler(async (req, res) => {
  if (req.user?.role === "doctor") {
    throw new ApiError(403, "Only patients can view patient reports");
  }

  const reports = await AppointmentReport.find({ patientId: req.user._id })
    .populate("doctorId", "username email code")
    .populate("appointmentId", "appointmentDate problem status")
    .sort({ reportDate: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, reports, "Patient reports fetched successfully"));
});



const markReportAsRead = asyncHandler(async (req, res) => {
  if (req.user?.role === "doctor") {
    throw new ApiError(403, "Only patients can update patient reports");
  }

  const { reportId } = req.params;
  if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
    throw new ApiError(400, "Valid reportId is required");
  }

  const report = await AppointmentReport.findOne({
    _id: reportId,
    patientId: req.user._id,
  })
    .populate("doctorId", "username email code")
    .populate("appointmentId", "appointmentDate problem status");

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  if (!report.isRead) {
    report.isRead = true;
    await report.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Report marked as read"));
});



const getDoctorSentReports = asyncHandler(async (req, res) => {
  if (req.user?.role !== "doctor") {
    throw new ApiError(403, "Only doctors can view sent reports");
  }

  const reports = await AppointmentReport.find({ doctorId: req.user._id })
    .populate("patientId", "username email")
    .populate("appointmentId", "appointmentDate problem status")
    .sort({ reportDate: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, reports, "Doctor sent reports fetched successfully"));
});


const addDailyHealthNote = asyncHandler(async (req, res) => {
  if (req.user?.role === "doctor") {
    throw new ApiError(403, "Only patients can add daily health notes");
  }

  const note = String(req.body?.note || "").trim();
  if (!note) {
    throw new ApiError(400, "Note content is required");
  }

  const createdNote = await DailyHealthNote.create({
    patientId: req.user._id,
    note,
    noteDate: req.body?.noteDate ? new Date(req.body.noteDate) : new Date(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdNote, "Daily health note added successfully"));
});



const getMyDailyHealthNotes = asyncHandler(async (req, res) => {
  if (req.user?.role === "doctor") {
    throw new ApiError(403, "Only patients can view their own daily health notes");
  }

  const notes = await DailyHealthNote.find({ patientId: req.user._id }).sort({ noteDate: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Daily health notes fetched successfully"));
});


const getPatientDailyHealthNotesForDoctor = asyncHandler(async (req, res) => {
  if (req.user?.role !== "doctor") {
    throw new ApiError(403, "Only doctors can view patient daily health notes");
  }

  const { patientId } = req.params;
  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, "Valid patientId is required");
  }

  const isLinked = await DoctorPatientRequest.findOne({
    doctorId: req.user._id,
    patientId,
    status: "ACCEPTED",
  });

  if (!isLinked) {
    throw new ApiError(403, "You can only view notes for your linked patients");
  }

  const notes = await DailyHealthNote.find({ patientId }).sort({ noteDate: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Patient daily health notes fetched successfully"));
});


export {
  getPendingRequests,
  acceptRequest,
  rejectRequest,
  getDoctorDashboard,
  sendDoctorRequest,
  getAllDoctors,
  getPatientRequestStatus,
  getPatientRequests,
  scheduleAppointment,
  sendAppointmentReport,
  getMyReports,
  markReportAsRead,
  getDoctorSentReports,
  addDailyHealthNote,
  getMyDailyHealthNotes,
  getPatientDailyHealthNotesForDoctor,
};