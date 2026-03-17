import { Router } from "express";
import {  loginUser, registerUser} from "../controllers/user.controller.jsx";

import { getDashboardStats } from "../controllers/dashboard.controller.jsx";


const router =Router()
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)   
router.route("/dashboard").get(getDashboardStats)
export default router