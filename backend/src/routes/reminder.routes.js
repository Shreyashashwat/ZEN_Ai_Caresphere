import express from 'express';
import {
  getReminders,
  addReminder,
  updateReminderStatus,
  deleteReminder,
  markasMissed,
  markasTaken,
} from '../controllers/reminder.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
const router = express.Router();


router.get('/', verifyJwt,getReminders);
router.post('/', verifyJwt,addReminder);
router.put('/:id', verifyJwt,updateReminderStatus);
router.delete('/:id',verifyJwt, deleteReminder);

router.route("/taken/:reminderId").patch(verifyJwt,markasTaken)
router.route("/missed/:reminderId").patch(verifyJwt,markasMissed)

export default router;