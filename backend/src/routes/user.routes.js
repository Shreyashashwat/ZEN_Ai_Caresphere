import { Router } from "express";
import {  loginUser, registerUser,connectToDoctor} from "../controllers/user.controller.js";
import {getDashboardStats} from "../controllers/dashboard.controller.js"
import { verifyJwt ,doctorOnly} from "../middleware/auth.middleware.js";
import { getHistory } from "../controllers/history.controller.js";
import {getDoctorDashboard} from "../controllers/doctorDashboard.controller.js"
const router =Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)   
router.route("/dashboard").get(verifyJwt,getDashboardStats)
router.route("/history").get(verifyJwt,getHistory)
router.get("/doctor/dashboard", verifyJwt,getDoctorDashboard);
router.post("/connect-doctor",verifyJwt,connectToDoctor);

export default router