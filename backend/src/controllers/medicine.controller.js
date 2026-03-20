import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Medicine } from "../model/medicine.model.js";
import { Reminder } from "../model/reminderstatus.js";
import { Calendar } from "../model/calendar.model.js";
import { addMedicineToGoogleCalendar } from "../utils/googleCalendar.js";
import axios from 'axios';
import mongoose from "mongoose";


const getMedicines = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(400, "User ID missing");

  const medicines = await Medicine.find({ userId });

  return res.status(200).json(new ApiResponse(200, medicines , "Medicines fetched successfully"));
});

const addMedicine = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(400, "Invalid user");

  const { medicineName, dosage, frequency, time, startDate, endDate, repeat } = req.body;

  const medicine = await Medicine.create({
    userId,
    medicineName,
    dosage,
    frequency,
    time: Array.isArray(time) ? time : [time],
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : undefined,
    repeat: repeat || "daily",
  });
  const calendarData = await Calendar.findOne({ userId });
  console.log(userId);
  console.log("yescalender");
  console.log(calendarData);
  
  const googleEventIds = [];
  if (calendarData) {
    const start= new Date(medicine.startDate);
const end = medicine.endDate ? new Date(medicine.endDate) : new Date(start);
   for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  for (const t of medicine.time) {
    const doseTime = new Date(`${d.toISOString().split("T")[0]}T${t}:00`);
    const eventId = await addMedicineToGoogleCalendar(calendarData, medicine, doseTime);
    googleEventIds.push(eventId);
  }
}
     medicine.googleEventIds = googleEventIds;
await medicine.save();
  }

  return res.status(201).json(new ApiResponse(201, medicine, "Medicine added successfully"));
});


const updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  console.log(`userID:${req.user}`);
  if (!userId) throw new ApiError(400, "User ID missing");

  const updateData = req.body; 

  const medicine = await Medicine.findOneAndUpdate(
    { _id: id, userId },
    updateData,
    { new: true }
  );
  console.log("userId")
  console.log(userId)

  if (!medicine) throw new ApiError(404, "Medicine not found or not authorized");
  console.log("10000000000")
 
   const calendarData = await Calendar.findOne({  userId: new mongoose.Types.ObjectId(userId) });
   console.log(calendarData)

   const googleEventIds = [];
  if (calendarData && updateData.time) {
    // Delete previous events or update them (optional)
    // Then add new times as events
      const start= new Date(medicine.startDate);
const end = medicine.endDate ? new Date(medicine.endDate) : new Date(start);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  for (const t of medicine.time) {
    const doseTime = new Date(`${d.toISOString().split("T")[0]}T${t}:00`);
    const eventId = await addMedicineToGoogleCalendar(calendarData, medicine, doseTime);
    googleEventIds.push(eventId);
  }
}
     medicine.googleEventIds = googleEventIds;
await medicine.save();
  }

  return res.status(200).json(new ApiResponse(200, medicine, "Medicine updated successfully"));
});

const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new ApiError(404, "Medicine not found");
  await Reminder.deleteMany({ medicineId: medicine._id });
  await medicine.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Medicine deleted successfully"));
});


const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new ApiError(404, "Medicine not found");

  return res.status(200).json(new ApiResponse(200, medicine, "Medicine fetched successfully"));
});
export const snoozeMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body; // e.g., { minutes: 10 }

    const snoozeUntil = new Date(Date.now() + minutes * 60000);
    const med = await Medicine.findByIdAndUpdate(
      id,
      { snoozedUntil: snoozeUntil },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Snoozed for ${minutes} minutes.`,
      snoozedUntil: med.snoozedUntil,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const validateMedicine = async (req, res) => {

  const { name } = req.params;
  console.log(name);
  try {
    const response = await axios.get(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${name}"+openfda.brand_name:"${name}"`
    );

    if (response.data.results && response.data.results.length > 0) {
      return res.json({ valid: true });
    } else {
      return res.json({ valid: false });
    }
  } catch (err) {
    console.log(err)
    return res.json({ valid: false });
  }
};

export { getMedicines, addMedicine, updateMedicine, deleteMedicine, getMedicine,validateMedicine };