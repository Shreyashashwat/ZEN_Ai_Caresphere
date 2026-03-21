// import { Reminder } from "../model/reminder.model.js"; // Update path if needed
import { Medicine } from "../model/medicine.model.js";
import { Reminder } from "../model/reminderstatus.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  
  if (!userId) {
    throw new ApiError(400, "User ID is missing");
  }

  const days = parseInt(req.query.days) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  console.log(`📅 Fetching history for user ${userId} from ${startDate.toISOString()}`);

  // ✅ Get reminders from the Reminder collection
  const reminders = await Reminder.find({
    userId: userId,
    time: { $gte: startDate }
  })
  .populate('medicineId', 'medicineName dosage frequency')
  .sort({ time: -1 })
  .lean();

  console.log(`📊 Found ${reminders.length} reminder records`);

  // Transform the data to match frontend expectations
  const history = reminders.map(reminder => ({
    _id: reminder._id,
    historyId: reminder._id,
    medicineId: reminder.medicineId,
    medicineName: reminder.medicineId?.medicineName || 'Unknown Medicine',
    dosage: reminder.medicineId?.dosage || '',
    frequency: reminder.medicineId?.frequency || '',
    time: reminder.time,
    status: reminder.status, // pending, taken, missed
    userResponseTime: reminder.userResponseTime,
    delayMinutes: reminder.userResponseTime 
      ? Math.round((new Date(reminder.userResponseTime) - new Date(reminder.time)) / 60000)
      : null
  }));

  // Calculate stats
  const stats = {
    total: history.length,
    taken: history.filter(h => h.status === 'taken').length,
    missed: history.filter(h => h.status === 'missed').length,
    pending: history.filter(h => h.status === 'pending').length,
    adherenceRate: history.length > 0 
      ? Math.round((history.filter(h => h.status === 'taken').length / history.length) * 100)
      : 0
  };

  console.log(`✅ Returning ${history.length} records (${stats.adherenceRate}% adherence)`);
  console.log(`📊 Stats:`, stats);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: history, // ✅ This matches what frontend expects
        stats
      },
      `History fetched successfully`
    )
  );
});

export { getHistory };