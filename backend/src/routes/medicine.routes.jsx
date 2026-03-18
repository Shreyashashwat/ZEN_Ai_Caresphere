import express from "express";
import {
  getMedicines,
  getMedicine,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicine.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
  .get(verifyJwt, getMedicines)  
  .post(verifyJwt, addMedicine);  

router.route("/:id")
  .get(verifyJwt, getMedicine)    
  .put(verifyJwt, updateMedicine) 
 .delete(verifyJwt, deleteMedicine)



export default router;