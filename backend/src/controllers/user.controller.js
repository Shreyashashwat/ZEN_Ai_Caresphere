import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import Doctor from "../model/doctor.js";

import { Medicine } from "../model/medicine.model.js";
import { Reminder } from "../model/reminderstatus.js";
import { callLLM } from "./llm.controller.js";
import WeeklyInsight from "../model/insights.model.js";
import { getWeekRange } from "../utils/getWeeklyRange.js";
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, age, gender, doctorCode, role } = req.body;

  // ==========================
  // LOGIC FOR DOCTOR REGISTRATION
  // ==========================
  if (role === "doctor") {
    if ([username, email, password, doctorCode].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields (Username, Email, Password, Code) are required for Doctors");
    }

    const existedDoctor = await Doctor.findOne({
      $or: [{ username }, { email }, { code: doctorCode }],
    });

    if (existedDoctor) {
      throw new ApiError(409, "Doctor with these credentials already exists");
    }

    const doctor = new Doctor({
      username,
      email,
      password,
      code: doctorCode, 
      role: "doctor"
    });
   console.log(doctor);
    await doctor.save();
    console.log("ijsc")
    const createdDoctor = await Doctor.findById(doctor._id).select("-password");
    console.log("doctor created")
    return res.status(201).json(
      new ApiResponse(201, createdDoctor, "Doctor registered successfully")
    );
  } 
  
  // ==========================
  else {
    if ([username, email, password, gender, doctorCode].some((field) => field?.trim() === "") || !age) {
      throw new ApiError(400, "All fields are required");
    }

    if (!email.includes("@")) {
      throw new ApiError(400, "Invalid email format");
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User already registered");
    }


    const user = new User({ 
        username, 
        email, 
        password, 
        age, 
        gender, 
        doctorCode, 
        role: "user" 
    });
    
    await user.save();

    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    return res.status(201).json(
      new ApiResponse(201, createdUser, "User registered successfully")
    );
  }
});
const registerUser1 = asyncHandler(async (req, res) => {
  console.log("yes noo")
  const { username, email, password, age, gender ,doctorCode} = req.body;

  if ([username, email, password, gender].some((field) => field?.trim() === "") || !age) {
    throw new ApiError(400, "All fields are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email format");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already registered");
  }

  const user = new User({ username, email, password, age, gender ,doctorCode});
  await user.save();

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body; 

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  let user;
  let modelType; 

  // ==========================
  if (role === "doctor") {
    user = await Doctor.findOne({ email });
    modelType = "doctor";
  } 
  // ==========================
  else {
    user = await User.findOne({ email });
    modelType = "user";
  }

  if (!user) {
    throw new ApiError(404, `${role === 'doctor' ? 'Doctor' : 'User'} not found`);
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password");
  }

  const token = jwt.sign(
    { 
      _id: user._id, 
      email: user.email, 
      username: user.username,
      role: modelType 
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const loggedInUser = role === "doctor" 
    ? await Doctor.findById(user._id).select("-password")
    : await User.findById(user._id).select("-password");
console.log(loggedInUser);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: loggedInUser, token }, `${role === 'doctor' ? 'Doctor' : 'User'} logged in successfully`)
    );
});
const loginUser1 = asyncHandler(async (req, res) => {
  console.log(" yes");
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Incorrect password");

 
  const token = jwt.sign(
    { _id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } 
  );
  // console.log("hgffd");
  console.log("Generated Token:", token);

  const loggedInUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: loggedInUser, token }, "Logged in successfully")
    );
});


const logOut = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});



const connectToDoctor = asyncHandler(async (req, res) => {
  const { doctorCode } = req.body;
  const userId = req.user._id; 

  if (!doctorCode) throw new ApiError(400, "Doctor code is required");

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { doctorCode } },
    { new: true }
  ).select("-password");

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Successfully connected to doctor"));
});

export { registerUser, loginUser, logOut,connectToDoctor };
export const generateWeeklyInsightsForAllUsers = async () => {
  console.log("🚀 Starting weekly insights generation for all users");

  let users;
  try {
    users = await User.find({}, { _id: 1 });
    console.log(`👥 Found ${users.length} users`);
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    return;
  }

  for (const user of users) {
    console.log(`\n➡️ Processing user: ${user._id}`);
    try {
      await processUserWeeklyInsights(user._id);
      console.log(`✅ Done for user: ${user._id}`);
    } catch (err) {
      console.error(
        `❌ Error processing user ${user._id}:`,
        err.message,
        err.stack
      );
    }
  }

  console.log("🏁 Weekly insights job finished");
};

export const processUserWeeklyInsights = async (userId) => {
  console.log("🧠 processUserWeeklyInsights START", userId);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  console.log("📅 Fetching reminder data since:", sevenDaysAgo.toISOString());

  // ---------------- REMINDER LOGS (SOURCE OF TRUTH) ----------------
  let reminderLogs;
  try {
    reminderLogs = await Reminder.find({
      userId: userId,
      time: { $gte: sevenDaysAgo }
    }).populate("medicineId");

    console.log(`⏰ Reminder logs found: ${reminderLogs.length}`);
  } catch (err) {
    console.error("❌ Error fetching reminder logs:", err);
    throw err;
  }

  if (reminderLogs.length === 0) {
    console.log("⚠️ No reminder logs → skipping user");
    return;
  }

  // ---------------- AGGREGATION ----------------
  // Only count reminders that have been resolved (taken or missed)
  const resolvedReminders = reminderLogs.filter(r => 
    r.status === "taken" || r.status === "missed"
  );
  
  console.log(`📊 Total reminders: ${reminderLogs.length}, Resolved: ${resolvedReminders.length}`);

  // Skip if no resolved reminders (all are pending/future)
  if (resolvedReminders.length === 0) {
    console.log("⚠️ No resolved reminders (all pending) → skipping user");
    return;
  }

  const total = resolvedReminders.length;
  const taken = resolvedReminders.filter(r => r.status === "taken").length;
  const missed = resolvedReminders.filter(r => r.status === "missed").length;

  const adherence = Math.round((taken / total) * 100);

  // Get missed times and analyze patterns
  const missedReminders = resolvedReminders.filter(r => r.status === "missed");
  
  let mostMissedTime = "none";
  if (missedReminders.length > 0) {
    // Group by hour to find most common missed time
    const hourCounts = {};
    missedReminders.forEach(r => {
      const hour = new Date(r.time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostMissedHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    if (mostMissedHour !== undefined) {
      const hour = parseInt(mostMissedHour);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      mostMissedTime = `${displayHour}:00 ${period}`;
    }
  }

  console.log("📈 Aggregated values:", {
    total,
    taken,
    missed,
    adherence,
    mostMissedTime,
    pendingCount: reminderLogs.length - resolvedReminders.length
  });

  // Validate data makes sense
  if (taken + missed !== total) {
    console.error("❌ Data inconsistency detected:", { taken, missed, total });
    throw new Error("Data validation failed: taken + missed !== total");
  }

  const weeklySummary = {
    adherence_percentage: adherence,
    total_doses: total,
    taken_doses: taken,
    missed_doses: missed,
    most_missed_time: mostMissedTime
  };

  console.log("🧾 Weekly summary to send to LLM:", weeklySummary);

  // ---------------- LLM CALL ----------------
  let llmResponse;
  try {
    llmResponse = await callLLM(weeklySummary);
    console.log("🤖 LLM raw response:", llmResponse);
  } catch (err) {
    console.error("❌ LLM call failed:", err.message);
    console.error("📦 Data sent to LLM:", weeklySummary);
    throw err;
  }

  if (!llmResponse || !Array.isArray(llmResponse.insights)) {
    console.error("❌ Invalid LLM response format:", llmResponse);
    throw new Error("Invalid LLM response");
  }

  // ---------------- SAVE TO DB ----------------
  try {
        const doc = await WeeklyInsight.findOneAndUpdate(
      {
        user_id: userId,
        week: getWeekRange()
      },
      {
        insights: llmResponse.insights,
        created_at: new Date()  // Update timestamp on regeneration
      },
      {
        upsert: true,  // Create if doesn't exist
        new: true,     // Return the updated document
        setDefaultsOnInsert: true
      }
    );
    


    console.log("💾 WeeklyInsight saved:", doc._id);
  } catch (err) {
    console.error("❌ Failed to save WeeklyInsight:", err);
    throw err;
  }

  console.log("🎉 processUserWeeklyInsights COMPLETE", userId);
};

// GET endpoint to fetch weekly insights for a user
export const getUserWeeklyInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const insights = await WeeklyInsight.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(10); // Get last 10 weeks
    
    // Return the most recent week's insights
    if (insights.length > 0) {
      return res.json({
        success: true,
        insights: insights[0].insights, // Return the insights array from the most recent document
        week: insights[0].week,
        created_at: insights[0].created_at
      });
    }
    
    return res.json({
      success: true,
      insights: []
    });
    
  } catch (error) {
    console.error('Error fetching weekly insights:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch insights' 
    });
  }
};