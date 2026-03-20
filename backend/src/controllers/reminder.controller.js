import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
const addReminder = asyncHandler(async (req, res) => {
  const { medicineId, time, status } = req.body;
  const userId = req.user;

  if (!medicineId || !time) throw new ApiError(400, "Medicine ID and time are required");

  const medicine = await Medicine.findOne({ _id: medicineId, userId });
  if (!medicine) throw new ApiError(404, "Medicine not found or unauthorized");

  const reminder = await Reminder.create({
    medicineId,
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
  const userId = req.user;

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
  const userId = req.user;
const reminders = await Reminder.find({ userId })
    .populate("medicineId", ["medicineName", "dosage", "frequency"])
    .sort({ time: 1 });

  res.status(200).json(new ApiResponse(200, reminders, "Reminders fetched successfully"));
});


const deleteReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user;

  const reminder = await Reminder.findOne({ _id: id, userId });
  if (!reminder) throw new ApiError(404, "Reminder not found");

  await reminder.deleteOne();

 
  await Medicine.updateOne(
    { _id: reminder.medicineId },
    { $pull: { statusHistory: reminder._id } }
  );

  res.status(200).json(new ApiResponse(200, {}, "Reminder deleted successfully"));
});
const markasTaken=asyncHandler(async(req,res)=>{
    const userId=req.user;
    const {reminderId}=req.params;
     if (!userId) throw new ApiError(400, "User ID missing");
  if (!reminderId) throw new ApiError(400, "Reminder ID missing");
 
  const reminder = await Reminder.findById(reminderId);
  if (!reminder) throw new ApiError(404, "Reminder not found");
 
  const medicine = await Medicine.findById(reminder.medicineId);
  if (!medicine || medicine.userId.toString() !== userId)
    throw new ApiError(403, "Not authorized");
reminder.status="taken";
  reminder.userResponseTime = new Date();
  await reminder.save();
 
    medicine.status = "taken";
     medicine.takenCount += 1;
  await medicine.save();
  return res
    .status(200)
    .json(new ApiResponse(200, reminder, "Medicine marked as taken"));

})
const markasMissed=asyncHandler(async(req,res)=>{
    const userId=req.user;
    const {reminderId}=req.params;
     if (!userId) throw new ApiError(400, "User ID missing");
  if (!reminderId) throw new ApiError(400, "Reminder ID missing");
 
  const reminder = await Reminder.findById(reminderId);
  if (!reminder) throw new ApiError(404, "Reminder not found");
 
  const medicine = await Medicine.findById(reminder.medicineId);
  if (!medicine || medicine.userId.toString() !== userId)
    throw new ApiError(403, "Not authorized");
reminder.status="missed";
  reminder.userResponseTime = new Date();
  await reminder.save();
 
    medicine.status = "missed";
     medicine.missedCount += 1;
  await medicine.save();
  return res
    .status(200)
    .json(new ApiResponse(200, reminder, "Medicine marked as taken"));

})

export { addReminder, updateReminderStatus, getReminders, deleteReminder ,markasTaken,markasMissed};