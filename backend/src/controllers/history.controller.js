import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Medicine } from "../model/medicine.model.js";

/**
 * Get medication history with flexible filtering
 * Query params: days (default: 7), limit, status
 */
const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  
  if (!userId) {
    throw new ApiError(400, "User ID is missing");
  }

  // Get query parameters with defaults
  const days = parseInt(req.query.days) || 7; // Default 7 days
  const limit = parseInt(req.query.limit) || 100; // Max 100 records
  const statusFilter = req.query.status; // 'taken', 'missed', 'snoozed'

  // Calculate start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0); // Start of day

  console.log(`📅 Fetching history from ${startDate.toISOString()} (${days} days)`);

  // Fetch medicines for this user
  const medicines = await Medicine.find({ 
    user_id: userId 
  }).lean(); // Use lean() for better performance

  if (!medicines || medicines.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No medicines found for this user")
    );
  }

  // Build history from statusHistory embedded arrays
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
        // Calculate delay if missed/taken late
        delayMinutes: status.userResponseTime 
          ? Math.round((new Date(status.userResponseTime) - new Date(status.time)) / 60000)
          : null
      }));

    history = history.concat(filteredHistory);
  }

  // Sort by time (latest first)
  history.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Apply limit
  const limitedHistory = history.slice(0, limit);

  // Calculate statistics
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