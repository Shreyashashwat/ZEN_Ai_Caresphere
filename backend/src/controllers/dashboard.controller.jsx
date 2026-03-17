import { ApiResponse } from "../utils/ApiResponse";
import { Reminder } from "../model/reminderstatus";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const getDashboardStats=asyncHandler(async(req,res)=>{
    const userId=req.userId;
    if(!userId) throw new ApiError(400,"User Id missing");
    const reminders=await Reminder.find({medicationId:{$exists:true},userId});
    let takenCount=0;
    let missedCount=0;
    reminders.forEach((rem)=>{
        if(rem.status=="taken") takenCount++;
        else if(rem.status=="missed")missedCount++;
    });
    return res.status(200).json(new ApiResponse(200,{taken:takenCount,missed:missedCount},"Dashboard stats fetched Succesfully"))
})
export {getDashboardStats}