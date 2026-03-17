import express from "express";
import {
  getMedicines,
  getMedicine,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicineController.js";
import { verifyJwt } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(verifyJwt, getMedicines)  
  .post(verifyJwt, addMedicine);  

router.route("/:id")
  .get(verifyJwt, getMedicine)    
  .put(verifyJwt, updateMedicine) 
  .delete(verifyJwt, deleteMedicine); 



export default router;