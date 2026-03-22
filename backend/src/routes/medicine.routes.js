import express from "express";
import {
  getMedicines,
  getMedicine,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  validateMedicine,
} from "../controllers/medicine.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { snoozeMedicine } from "../controllers/medicine.controller.js";


const router = express.Router();

router.route("/")
  .get(verifyJwt, getMedicines)  
  .post(verifyJwt, addMedicine);  

router.route("/:id")
  .get(verifyJwt, getMedicine)    
  .put(verifyJwt, updateMedicine) 
  .delete(verifyJwt, deleteMedicine)

router.route("/:id/snooze").patch(snoozeMedicine)
router.route("/validate-medicine/:name").get(validateMedicine)

export default router;
