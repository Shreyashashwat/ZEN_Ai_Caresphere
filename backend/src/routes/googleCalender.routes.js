// routes/googleCalendar.routes.js
import express from "express";
import { getWebsiteGoogleEvents } from "../controllers/googleCalendar.controller.js";

import { verifyJwt } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/events", verifyJwt, getWebsiteGoogleEvents);

export default router;
