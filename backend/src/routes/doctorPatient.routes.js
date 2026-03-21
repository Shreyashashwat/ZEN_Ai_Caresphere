import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  sendDoctorRequest,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
  getDoctorDashboard,
  getAllDoctors,
  getPatientRequestStatus,
  getPatientRequests,
  getDoctorAppointments,
  scheduleAppointment,
  updateAppointmentStatus,
  
} from "../controllers/doctorPatient.controller.js";

const router = Router();

router.get("/doctors", getAllDoctors);

router.post("/doctor-request/send", verifyJwt, sendDoctorRequest);
router.get("/doctor-request/patient-requests", verifyJwt, getPatientRequests);
router.get("/doctor-request/status/:doctorId", verifyJwt, getPatientRequestStatus);

// Doctor routes - require authentication
router.get("/doctor-request/pending", verifyJwt, getPendingRequests);
router.post("/doctor-request/:id/accept", verifyJwt, acceptRequest);
router.post("/doctor-request/:id/reject", verifyJwt, rejectRequest);
router.get("/doctor/dashboard", verifyJwt, getDoctorDashboard);
router.post("/doctor-request/createAppointment",verifyJwt,scheduleAppointment);
router.get("/doctor-request/getappointments",verifyJwt,getDoctorAppointments);
router.post("/doctor-request/appointments/:appointmentId", verifyJwt, updateAppointmentStatus)

export default router;
