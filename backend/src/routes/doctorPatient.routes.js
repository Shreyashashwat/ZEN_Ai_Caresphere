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
  getPatientAppointments,
  getDoctorAppointments,
  scheduleAppointment,
  updateAppointmentStatus,
  sendAppointmentReport,
  getMyReports,
  markReportAsRead,
  getDoctorSentReports,
  addDailyHealthNote,
  getMyDailyHealthNotes,
  getPatientDailyHealthNotesForDoctor,
  
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
router.post("/doctor-request/appointments/:appointmentId",updateAppointmentStatus)
router.get("/doctor-request/getappointments/patient",verifyJwt,getPatientAppointments);
router.get("/doctor-request/doctor-appointments", verifyJwt, getDoctorAppointments);
router.post("/appointments/:appointmentId/report", verifyJwt, sendAppointmentReport);
router.get("/reports/my-reports", verifyJwt, getMyReports);
router.get("/reports/:reportId/read", verifyJwt, markReportAsRead);
router.get("/reports/doctor-reports", verifyJwt, getDoctorSentReports);

router.post("/daily-notes", verifyJwt, addDailyHealthNote);
router.get("/daily-notes/my", verifyJwt, getMyDailyHealthNotes);
router.get("/daily-notes/patient/:patientId", verifyJwt, getPatientDailyHealthNotesForDoctor);

export default router;
