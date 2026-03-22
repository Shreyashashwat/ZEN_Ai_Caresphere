import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/v1",

});

API.interceptors.request.use((req) => {
  const user = localStorage.getItem("user");
  if (user) {
    const parsed = JSON.parse(user);
    const token = parsed.data ? parsed.data.token : parsed.token;
    if (token) req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const loginUser = (data) => API.post("/users/login", data);
export const registerUser = (data) => API.post("/users/register", data);


export const getMedicines = () => API.get("/medicine");
export const addMedicine = (data) => API.post("/medicine", data);
// Doctor / Connectivity APIs
export const getAllDoctors = () => API.get("/doctors");
// export const sendDoctorRequest = (doctorId) => API.post("/users/request-doctor", { doctorId });
// export const getPatientRequests = () => API.get("/users/patient-requests");
export const respondToRequest = (requestId, status) => API.put(`/users/request-doctor/${requestId}`, { status });
export const deleteMedicine = (id) => API.delete(`/medicine/${id}`);
export const updateMedicine = (id, data) => API.put(`/medicine/${id}`, data);
export const getMedicine = (id) => API.get(`/medicine/${id}`);


export const getReminders = () => API.get("/reminder");
export const addReminder = (data) => API.post("/reminder", data);
export const updateReminderStatus = (reminderId, data) =>
  API.put(`/reminder/${reminderId}`, data);
export const deleteReminder = (reminderId) =>
  API.delete(`/reminder/${reminderId}`);
export const markasTaken = (reminderId) =>
  API.patch(`/reminder/taken/${reminderId}`);
export const markasMissed = (reminderId) =>
  API.patch(`/reminder/missed/${reminderId}`);
export const fetchHistory = () => API.get(`/users/history`);
export const getDashboardStats = () => API.get("/users/dashboard");

export const inviteCaregiver = (data) => API.post("/caregiver/invite", data);
export const getMyCaregivers = () => API.get("/caregiver/my-caregivers");
export const deleteCaregiver = (id) => API.delete(`/caregiver/${id}`);

export const getPendingInvites = () => API.get("/caregiver/pending-invites");
export const respondToInvite = (id, action) => API.post(`/caregiver/respond/${id}`, { action });
export const getMyPatients = () => API.get("/caregiver/my-patients");
export const getPatientDetails = (id) => API.get(`/caregiver/patient/${id}`);

// Doctor-Patient Request APIs
// export const getAllDoctors = () => API.get("/doctors");
export const sendDoctorRequest = (doctorId) => API.post("/doctor-request/send", { doctorId });
export const getPatientRequests = () => API.get("/doctor-request/patient-requests");
export const getPatientRequestStatus = (doctorId) => API.get(`/doctor-request/status/${doctorId}`);
export const getPendingDoctorRequests = () => API.get("/doctor-request/pending");
export const acceptDoctorRequest = (requestId) => API.post(`/doctor-request/${requestId}/accept`);
export const rejectDoctorRequest = (requestId) => API.post(`/doctor-request/${requestId}/reject`);
export const getDoctorDashboard = () => API.get("/doctor/dashboard");
export const createAppointment = (data) => API.post(`/doctor-request/createAppointment`, data);
export const getDoctorAppointments = () => API.get(`/doctor-request/getappointments`);
export const updateAppointmentStatus = (appointmentId, status) => 
  API.post(`/doctor-request/appointments/${appointmentId}`, { status });

export default API;
