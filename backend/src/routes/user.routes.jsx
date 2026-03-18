import { Router } from "express";
import {  loginUser, registerUser} from "../controllers/user.controller.js";
import {getDashboardStats} from "../controllers/dashboard.controller.js"
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getHistory } from "../controllers/history.controller.js";

const router =Router()
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)   
router.route("/dashboard").get(verifyJwt,getDashboardStats)
router.route("/history").get(verifyJwt,getHistory)
export default router