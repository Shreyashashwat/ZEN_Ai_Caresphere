import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Reminder } from "../model/reminder.model.js";
import { Medicine } from "../model/medicine.model.js";
const addReminder = asyncHandler(async (req, res) => {
  const { medicationId, time, status } = req.body;
  const userId = req.userId;

  if (!medicationId || !time) throw new ApiError(400, "Medication ID and time are required");

  const medicine = await Medicine.findOne({ _id: medicationId, userId });
  if (!medicine) throw new ApiError(404, "Medicine not found or unauthorized");

  const reminder = await Reminder.create({
    medicationId,
    userId,
    time: new Date(time),
    status: status || "pending",

  });


  medicine.statusHistory.push(reminder._id);
  await medicine.save();

  res.status(201).json(new ApiResponse(201, reminder, "Reminder created successfully"));
});


const updateReminderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params; 
  const { status } = req.body;
  const userId = req.userId;

  if (!status || !["pending", "taken", "missed"].includes(status))
    throw new ApiError(400, "Invalid status");

  const reminder = await Reminder.findOneAndUpdate(
    { _id: id, userId },
    { status, userResponseTime: new Date() },
    { new: true }
  );

  if (!reminder) throw new ApiError(404, "Reminder not found or unauthorized");

  res.status(200).json(new ApiResponse(200, reminder, "Reminder status updated"));
});


const getReminders = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const reminders = await Reminder.find({ userId }).populate("medicationId", "medicineName","dosage","frequency").sort({time:1});

  res.status(200).json(new ApiResponse(200, reminders, "Reminders fetched successfully"));
});


const deleteReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const reminder = await Reminder.findOne({ _id: id, userId });
  if (!reminder) throw new ApiError(404, "Reminder not found");

  await reminder.deleteOne();

 
  await Medicine.updateOne(
    { _id: reminder.medicationId },
    { $pull: { statusHistory: reminder._id } }
  );

  res.status(200).json(new ApiResponse(200, {}, "Reminder deleted successfully"));
});

export { addReminder, updateReminderStatus, getReminders, deleteReminder };