import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
    inviteCaregiver,
    getMyCaregivers,
    removeCaregiver,
    getPendingInvites,
    respondToInvite,
    getAssignedPatients,
    getPatientDetails,
} from "../controllers/caregiver.controller.js";

const router = Router();

router.use(verifyJwt); // Protect all routes

router.post("/invite", inviteCaregiver);
router.get("/my-caregivers", getMyCaregivers);
router.delete("/:id", removeCaregiver);

// Caregiver side routes
router.get("/pending-invites", getPendingInvites);
router.post("/respond/:id", respondToInvite);
router.get("/my-patients", getAssignedPatients);
router.get("/patient/:patientId", getPatientDetails);

export default router;
