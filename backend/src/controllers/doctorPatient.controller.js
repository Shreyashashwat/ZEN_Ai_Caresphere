import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DoctorPatientRequest } from "../model/doctorPatientRequest.model.js";
import { User } from "../model/user.model.js";
import Doctor from "../model/doctor.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";

/**
 * Patient sends a request to a doctor
 */
const sendDoctorRequest = asyncHandler(async (req, res) => {
  const patientId = req.user; // From verifyJwt middleware
  const { doctorId } = req.body;

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

  // Check if request already exists
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

/**
 * Doctor gets all pending requests
 */
const getPendingRequests = asyncHandler(async (req, res) => {
  const doctorId = req.user; // From verifyJwt middleware

  // Verify doctor exists
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

/**
 * Doctor accepts a request
 */
const acceptRequest = asyncHandler(async (req, res) => {
  const doctorId = req.user; // From verifyJwt middleware
  const { id } = req.params;

  const request = await DoctorPatientRequest.findById(id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // Verify the request belongs to this doctor
  if (request.doctorId.toString() !== doctorId.toString()) {
    throw new ApiError(403, "Unauthorized: This request does not belong to you");
  }

  // Update request status
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

/**
 * Doctor rejects a request
 */
const rejectRequest = asyncHandler(async (req, res) => {
  const doctorId = req.user; // From verifyJwt middleware
  const { id } = req.params;

  const request = await DoctorPatientRequest.findById(id);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // Verify the request belongs to this doctor
  if (request.doctorId.toString() !== doctorId.toString()) {
    throw new ApiError(403, "Unauthorized: This request does not belong to you");
  }

  // Update request status
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

/**
 * Get doctor dashboard with only accepted patients
 */
const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user; // From verifyJwt middleware

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  // Get all accepted requests for this doctor
  const acceptedRequests = await DoctorPatientRequest.find({
    doctorId,
    status: "ACCEPTED",
  }).populate("patientId", "username email age gender");

  // Extract patient IDs
  const patientIds = acceptedRequests.map((req) => {
    const patient = req.patientId;
    // Handle both populated and non-populated cases
    if (patient && patient._id) {
      return patient._id;
    }
    return patient; // If not populated, it's already an ObjectId
  }).filter(Boolean); // Remove any null/undefined values

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

  // Get patients data
  const patients = await User.find({ _id: { $in: patientIds } }).select(
    "-password"
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Fetch reminders and medicines only for accepted patients
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
      missedCount,
      status: missedCount > 3 ? "Critical" : "Stable",
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

/**
 * Get all doctors (for patient to see and send requests)
 */
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

/**
 * Get patient's request status for a specific doctor
 */
const getPatientRequestStatus = asyncHandler(async (req, res) => {
  const patientId = req.user; // From verifyJwt middleware
  const { doctorId } = req.params;

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

/**
 * Get all requests for a patient (to see status of all sent requests)
 */
const getPatientRequests = asyncHandler(async (req, res) => {
  const patientId = req.user; // From verifyJwt middleware

  const requests = await DoctorPatientRequest.find({ patientId })
    .populate("doctorId", "username email code")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, requests, "Patient requests fetched successfully")
    );
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
};
