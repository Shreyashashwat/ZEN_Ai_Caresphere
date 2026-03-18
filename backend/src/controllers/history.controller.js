import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Medicine } from "../model/medicine.model.js";

const getHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId)
    return res.status(400).json(new ApiResponse(400, null, "User is missing"));

  const medicines = await Medicine.find({ userId }).populate("statusHistory");
  const history = medicines.flatMap((med) =>
    med.statusHistory.map((status) => ({
      medicineName: med.medicineName,
      dosage: med.dosage,
      frequency: med.frequency,
      time: status.time,
      status: status.status,
      userResponseTime: status.userResponseTime,
    }))
  );


  history.sort((a, b) => new Date(b.time) - new Date(a.time));

  return res
    .status(200)
    .json(new ApiResponse(200, history, "Medicine history fetched successfully"));
});

export { getHistory };