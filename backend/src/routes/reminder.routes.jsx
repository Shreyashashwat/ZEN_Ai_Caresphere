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


router.get('/', getReminders);
router.post('/', addReminder);
router.put('/:id', updateReminderStatus);
router.delete('/:id', deleteReminder);

router.route("/reminder/taken/:reminderId").patch(verifyJwt,markasTaken)
router.route("/reminder/missed/:reminderId").patch(verifyJwt,markasMissed)

export default router;