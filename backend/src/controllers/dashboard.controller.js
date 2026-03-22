import { ApiResponse } from "../utils/ApiResponse.js";
import { Reminder } from "../model/reminderstatus.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redisClient from "../configs/redisClient.js"; 

const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    if (!userId) throw new ApiError(400, "User Id missing");

    const cacheKey = `dashboard_stats:${userId}`;

    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
        return res.status(200).json(
            new ApiResponse(200, JSON.parse(cachedData), "Dashboard stats fetched from cache")
        );
    }

    const reminders = await Reminder.find({ medicineId: { $exists: true }, userId });
    
    let takenCount = 0;
    let missedCount = 0;

    reminders.forEach((rem) => {
        if (rem.status === "taken") takenCount++;
        else if (rem.status === "missed") missedCount++;
    });

    const stats = { taken: takenCount, missed: missedCount };
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(stats));

    return res.status(200).json(
        new ApiResponse(200, stats, "Dashboard stats fetched Successfully")
    );
});

export { getDashboardStats };