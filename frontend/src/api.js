import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/v1", // change to your backend URL
});

export const fetchMedicines = () => API.get("/medicines");
export const addMedicine = (data) => API.post("/medicines", data);
export const fetchHistory = () => API.get("/history");
export const loginUser = (data) => API.post("/auth/login", data);

export default API;