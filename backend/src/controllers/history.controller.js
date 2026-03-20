import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Medicine } from "../model/medicine.model.js";


const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  
  if (!userId) {
    throw new ApiError(400, "User ID is missing");
  }

  const days = parseInt(req.query.days) || 7;
  const limit = parseInt(req.query.limit) || 100;
  const statusFilter = req.query.status; 
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  console.log(`📅 Fetching history from ${startDate.toISOString()} (${days} days)`);

  const medicines = await Medicine.find({ 
    user_id: userId 
  }).lean(); 

  if (!medicines || medicines.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No medicines found for this user")
    );
  }

  let history = [];

  for (const med of medicines) {
    if (!med.statusHistory || !Array.isArray(med.statusHistory)) {
      continue;
    }

    const filteredHistory = med.statusHistory
      .filter((status) => {
        const statusDate = new Date(status.time);
        const isInDateRange = statusDate >= startDate;
        const matchesStatus = !statusFilter || status.status === statusFilter;
        return isInDateRange && matchesStatus;
      })
      .map((status) => ({
        historyId: status._id,
        medicineId: med._id,
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        time: status.time,
        status: status.status,
        userResponseTime: status.userResponseTime || null,
        delayMinutes: status.userResponseTime 
          ? Math.round((new Date(status.userResponseTime) - new Date(status.time)) / 60000)
          : null
      }));

    history = history.concat(filteredHistory);
  }

  history.sort((a, b) => new Date(b.time) - new Date(a.time));

  const limitedHistory = history.slice(0, limit);

  const stats = {
    total: history.length,
    taken: history.filter(h => h.status === 'taken').length,
    missed: history.filter(h => h.status === 'missed').length,
    snoozed: history.filter(h => h.status === 'snoozed').length,
    adherenceRate: history.length > 0 
      ? Math.round((history.filter(h => h.status === 'taken').length / history.length) * 100)
      : 0
  };

  console.log(`✅ Returning ${limitedHistory.length} records (${stats.adherenceRate}% adherence)`);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        history: limitedHistory,
        stats,
        filters: {
          days,
          status: statusFilter || 'all',
          limit
        }
      },
      `History fetched successfully`
    )
  );
});

export { getHistory };