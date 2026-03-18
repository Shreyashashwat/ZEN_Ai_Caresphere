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
  API.put(`/reminder/taken/${reminderId}`);
export const markasMissed = (reminderId) =>
  API.put(`/reminder/missed/${reminderId}`);
export const fetchHistory = () => API.get(`/users/history`);

export default API;