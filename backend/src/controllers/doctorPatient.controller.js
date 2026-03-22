import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DoctorPatientRequest } from "../model/doctorPatientRequest.model.js";
import { User } from "../model/user.model.js";
import Doctor from "../model/doctor.js";
import { Reminder } from "../model/reminderstatus.js";
import { Appointment } from "../model/appointment.model.js";

const getCurrentUserId = (req) => req.user?._id || req.user?.id || req.user;


const sendDoctorRequest = asyncHandler(async (req, res) => {
  const patientId = getCurrentUserId(req);
  const { doctorId } = req.body;

  if (!patientId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!doctorId) {
    throw new ApiError(400, "Doctor ID is required");
  }

  // Verify patient exists
  const patient = await User.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  const existingRequest = await DoctorPatientRequest.findOne({
    patientId,
    doctorId,
  });

  if (existingRequest) {
    throw new ApiError(400, "Request already sent to this doctor");
  }

  // Create new request
  const request = await DoctorPatientRequest.create({
    patientId,
    doctorId,
    status: "PENDING",
  });

  const populatedRequest = await DoctorPatientRequest.findById(request._id)
    .populate("patientId", "username email")
    .populate("doctorId", "username email code");

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedRequest,
        "Request sent to doctor successfully"
      )
    );
});


const getPendingRequests = asyncHandler(async (req, res) => {
  const doctorId = getCurrentUserId(req);
  if (!doctorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  const pendingRequests = await DoctorPatientRequest.find({
    doctorId,
    status: "PENDING",
  })
    .populate("patientId", "username email age gender")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        pendingRequests,
        "Pending requests fetched successfully"
      )
    );
});


const acceptRequest = asyncHandler(async (req, res) => {
  const loggedInDoctorId = getCurrentUserId(req);
  const { id } = req.params;

  if (!loggedInDoctorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const request = await DoctorPatientRequest.findById(id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.doctorId.toString() !== loggedInDoctorId.toString()) {
    throw new ApiError(403, "Unauthorized: This request does not belong to you");
  }

  request.status = "ACCEPTED";
  await request.save();

  const populatedRequest = await DoctorPatientRequest.findById(request._id)
    .populate("patientId", "username email age gender")
    .populate("doctorId", "username email code");

  return res
    .status(200)
    .json(
      new ApiResponse(200, populatedRequest, "Request accepted successfully")
    );
});


const rejectRequest = asyncHandler(async (req, res) => {
  const loggedInDoctorId = getCurrentUserId(req);
  const { id } = req.params;

  if (!loggedInDoctorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const request = await DoctorPatientRequest.findById(id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (!request.doctorId.equals(loggedInDoctorId)) {
    throw new ApiError(403, "Unauthorized: This request does not belong to you");
  }

  request.status = "REJECTED";
  await request.save();

  const populatedRequest = await DoctorPatientRequest.findById(request._id)
    .populate("patientId", "username email age gender")
    .populate("doctorId", "username email code");

  return res
    .status(200)
    .json(
      new ApiResponse(200, populatedRequest, "Request rejected successfully")
    );
});


const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = getCurrentUserId(req);
  if (!doctorId) {
    throw new ApiError(401, "Unauthorized");
  }

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

  const patients = await User.find({ _id: { $in: patientIds } }).select(
    "-password"
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayReminders, allRecentReminders] = await Promise.all([
    Reminder.find({
      userId: { $in: patientIds },
      time: { $gte: todayStart, $lte: todayEnd },
    })
      .populate("userId", "username")
      .populate("medicineId", "medicineName"),

    Reminder.find({
      userId: { $in: patientIds },
      time: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const stats = {
    totalPatients: patients.length,
    missedToday: todayReminders.filter((r) => r.status === "missed").length,
    takenToday: todayReminders.filter((r) => r.status === "taken").length,
    pendingToday: todayReminders.filter((r) => r.status === "pending").length,
  };

  const patientAdherence = patients.map((patient) => {
  const pReminders = allRecentReminders.filter(
    (r) => r.userId.toString() === patient._id.toString()
  );
  const missedCount = pReminders.filter((r) => r.status === "missed").length;

  return {
    patientName: patient.username,
    patientId: patient._id,
    email: patient.email,   
    age: patient.age,       
    gender: patient.gender, 
    missedCount,
    status: missedCount > 3 ? "Critical" : "Stable",
    todayMedicines: todayReminders.filter((r) => {
      const reminderUserId = r.userId?._id || r.userId;
      return reminderUserId?.toString() === patient._id.toString();
    })
  };
});
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stats,
        todaySchedule: todayReminders,
        patientList: patientAdherence,
      },
      "Doctor dashboard data fetched successfully"
    )
  );
});


const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ isActive: true })
    .select("-password")
    .sort({ username: 1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, doctors, "Doctors fetched successfully")
    );
});


const getPatientRequestStatus = asyncHandler(async (req, res) => {
  const patientId = getCurrentUserId(req);
  const { doctorId } = req.params;

  if (!patientId) {
    throw new ApiError(401, "Unauthorized");
  }

  const request = await DoctorPatientRequest.findOne({
    patientId,
    doctorId,
  })
    .populate("patientId", "username email")
    .populate("doctorId", "username email code");

  if (!request) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { status: "NONE" }, "No request found")
      );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, request, "Request status fetched successfully")
    );
});


const getPatientRequests = asyncHandler(async (req, res) => {
  const patientId = getCurrentUserId(req);

  if (!patientId) {
    throw new ApiError(401, "Unauthorized");
  }

  const requests = await DoctorPatientRequest.find({ patientId })
    .populate("doctorId", "username email code")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, requests, "Patient requests fetched successfully")
    );
});


const scheduleAppointment = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { doctorId, appointmentDate, problem } = req.body;

  if (!doctorId || !appointmentDate || !problem) {
    throw new ApiError(400, "All fields (Doctor, Date, Problem) are required");
  }

  // Create appointment
  const appointment = await Appointment.create({
    patientId,
    doctorId,
    appointmentDate,
    problem,
    status: "PENDING",
  });

  return res.status(201).json(
    new ApiResponse(201, appointment, "Appointment request sent to doctor")
  );
});

// controllers/appointmentController.js

export const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate("doctorId", "username email")
      .sort({ appointmentDate: 1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const doctorId = getCurrentUserId(req);
    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, doctorId },
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

export {
  
  getPendingRequests,
  acceptRequest,
  rejectRequest,
  getDoctorDashboard,
  
  sendDoctorRequest,
  getAllDoctors,
  getPatientRequestStatus,
  getPatientRequests,

  scheduleAppointment
};
