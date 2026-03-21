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
export const loginDoctor = (data) => API.post("/users/login-doctor", data);
export const registerUser = (data) => API.post("/users/register", data);


export const getMedicines = () => API.get("/medicine");
export const addMedicine = (data) => API.post("/medicine", data);
// Doctor / Connectivity APIs
export const getAllDoctors = () => API.get("/users/doctors");
export const sendDoctorRequest = (doctorId) => API.post("/users/request-doctor", { doctorId });
export const getPatientRequests = () => API.get("/users/patient-requests");
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

export default API;