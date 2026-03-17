import express from 'express';
import {
  getReminder,
  addReminder,
  updateReminder,
  deleteReminder,
} from '../controllers/reminderController.js';
const router = express.Router();


router.get('/', getReminder);
router.post('/', addReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

export default router;