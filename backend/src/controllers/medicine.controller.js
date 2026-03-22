import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Medicine } from "../model/medicine.model.js";
import { Reminder } from "../model/reminderstatus.js";
import { Calendar } from "../model/calendar.model.js";
import { addMedicineToGoogleCalendar } from "../utils/googleCalendar.js";
import axios from "axios";
import mongoose from "mongoose";


// ─── Get All Medicines (for logged-in user) ───────────────────────────────────
const getMedicines = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  if (!userId) throw new ApiError(400, "User ID missing");

  const medicines = await Medicine.find({ userId });
  return res.status(200).json(new ApiResponse(200, medicines, "Medicines fetched successfully"));
});


// ─── Add Medicine ─────────────────────────────────────────────────────────────
const addMedicine = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
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

  // Google Calendar sync is optional — never crash medicine save
  try {
    const calendarData = await Calendar.findOne({ userId });
    if (calendarData) {
      const start = new Date(medicine.startDate);
      const end = medicine.endDate ? new Date(medicine.endDate) : new Date(start);
      const googleEventIds = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        for (const t of medicine.time) {
          const doseTime = new Date(`${d.toISOString().split("T")[0]}T${t}:00`);
          const eventId = await addMedicineToGoogleCalendar(calendarData, medicine, doseTime);
          if (eventId) googleEventIds.push(eventId);
        }
      }

      if (googleEventIds.length > 0) {
        medicine.googleEventIds = googleEventIds;
        await medicine.save();
      }
    }
  } catch (calErr) {
    console.warn("⚠️ Google Calendar sync skipped:", calErr.message);
  }

  return res.status(201).json(new ApiResponse(201, medicine, "Medicine added successfully"));
});


// ─── Update Medicine ──────────────────────────────────────────────────────────
const updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;
  if (!userId) throw new ApiError(400, "User ID missing");

  const updateData = req.body;

  const medicine = await Medicine.findOneAndUpdate(
    { _id: id, userId },
    updateData,
    { new: true }
  );

  if (!medicine) throw new ApiError(404, "Medicine not found or not authorized");

  // Google Calendar sync is optional — never crash medicine update
  try {
    const calendarData = await Calendar.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (calendarData && updateData.time) {
      const start = new Date(medicine.startDate);
      const end = medicine.endDate ? new Date(medicine.endDate) : new Date(start);
      const googleEventIds = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        for (const t of medicine.time) {
          const doseTime = new Date(`${d.toISOString().split("T")[0]}T${t}:00`);
          const eventId = await addMedicineToGoogleCalendar(calendarData, medicine, doseTime);
          if (eventId) googleEventIds.push(eventId);
        }
      }

      if (googleEventIds.length > 0) {
        medicine.googleEventIds = googleEventIds;
        await medicine.save();
      }
    }
  } catch (calErr) {
    console.warn("⚠️ Google Calendar sync skipped:", calErr.message);
  }

  return res.status(200).json(new ApiResponse(200, medicine, "Medicine updated successfully"));
});


// ─── Delete Medicine ──────────────────────────────────────────────────────────
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new ApiError(404, "Medicine not found");
  await Reminder.deleteMany({ medicineId: medicine._id });
  await medicine.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Medicine deleted successfully"));
});


// ─── Get Single Medicine ──────────────────────────────────────────────────────
const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new ApiError(404, "Medicine not found");
  return res.status(200).json(new ApiResponse(200, medicine, "Medicine fetched successfully"));
});


// ─── Snooze Medicine ──────────────────────────────────────────────────────────
export const snoozeMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;
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


// ─── Validate Medicine via FDA API ────────────────────────────────────────────
const validateMedicine = async (req, res) => {
  const { name } = req.params;
  try {
    const response = await axios.get(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${name}"+openfda.brand_name:"${name}"`
    );
    if (response.data.results?.length > 0) {
      return res.json({ valid: true });
    }
    return res.json({ valid: false });
  } catch (err) {
    return res.json({ valid: false });
  }
};


// ─── Named Exports ────────────────────────────────────────────────────────────
export { getMedicines, addMedicine, updateMedicine, deleteMedicine, getMedicine, validateMedicine };