import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Medicine } from "../model/medicine.model.js";
import { Reminder } from "../model/reminderstatus.js";


const getMedicines = asyncHandler(async (req, res) => {
  const userId = req.user;
  if (!userId) throw new ApiError(400, "User ID missing");

  const medicines = await Medicine.find({ userId });

  return res.status(200).json(new ApiResponse(200, medicines , "Medicines fetched successfully"));
});

const addMedicine = asyncHandler(async (req, res) => {
  const userId = req.user; 
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

  return res.status(201).json(new ApiResponse(201, medicine, "Medicine added successfully"));
});


const updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user;
  if (!userId) throw new ApiError(400, "User ID missing");

  const updateData = req.body; 

  const medicine = await Medicine.findOneAndUpdate(
    { _id: id, userId },
    updateData,
    { new: true }
  );

  if (!medicine) throw new ApiError(404, "Medicine not found or not authorized");

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

export { getMedicines, addMedicine, updateMedicine, deleteMedicine, getMedicine, };