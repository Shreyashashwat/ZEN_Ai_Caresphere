import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouters from "./routes/user.routes.js"
import medicineRoutes from"./routes/medicine.routes.js"
import reminderRoutes from "./routes/reminder.routes.js"
import chatbotRoute from "./routes/chatbot.routes.js"
import saveNotificationToken from "./firebase/routes.js"
import googleAuth from "./routes/googleapis.routes.js"

import dotenv from "dotenv";
dotenv.config();

const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.get("/test", (req, res) => {
  res.send("Test route works!");
});
app.use('/api/v1/users',userRouters)
app.use('/api/v1/medicine',medicineRoutes)
app.use("/api/v1/reminder",reminderRoutes)
app.use("/api/v1/chatbot",chatbotRoute);
app.use("/api/v1/save-token",saveNotificationToken)
app.use("/api/v1",googleAuth)
export default app