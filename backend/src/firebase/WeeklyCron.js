import cron from "node-cron";
import { generateWeeklyInsightsForAllUsers } from "../controllers/user.controller.js";
cron.schedule("0 0 * * 0",async()=>{
    await generateWeeklyInsightsForAllUsers()
})