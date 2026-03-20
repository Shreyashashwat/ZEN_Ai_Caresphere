import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Reminder } from "../model/reminderstatus.js";
import { Medicine } from "../model/medicine.model.js";
import { updateMedicineInGoogleCalendar } from "../utils/googleCalendar.js";
import { addMedicineToGoogleCalendar } from "../utils/googleCalendar.js";
import { suggestNextTime } from "../utils/schedulerLogic.js";
import { Calendar } from "../model/calendar.model.js";
import { summarization } from "@huggingface/inference";
import { AIAnalytics } from "../model/alAnalytics.model.js";
import { predictAdherenceRisk } from "../ml/predict.js";
const addReminder = asyncHandler(async (req, res) => {
  const { medicineId, time, status } = req.body;
  const userId = req.user.id;

  if (!medicineId || !time)
    throw new ApiError(400, "Medicine ID and time are required");

  const medicine = await Medicine.findOne({ _id: medicineId, userId });
  if (!medicine)
    throw new ApiError(404, "Medicine not found or unauthorized");

  const reminder = await Reminder.create({
    medicineId,
    userId,
    time: new Date(time),
    status: status || "pending",
    eventId: null,
  });

  medicine.statusHistory.push(reminder._id);
  await medicine.save();

  // 📅 Calendar sync
  const calendarData = await Calendar.findOne({ userId });
  if (calendarData) {
    const eventId = await addMedicineToGoogleCalendar(
      calendarData,
      medicine,
      time
    );
    reminder.eventId = eventId;
    await reminder.save();
  }

  let risk = 0.5;
  try {
    const t = new Date(time);
    risk = await predictAdherenceRisk(
      t.getHours(),
      t.getDay(),
      0
    );
  } catch (e) {}

  await createPreReminderIfHighRisk(reminder, risk);

  res.status(201).json(
    new ApiResponse(201, reminder, "Reminder created successfully")
  );
});

const updateReminderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status || !["pending", "taken", "missed"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const reminder = await Reminder.findOne({ _id: id, userId });
  if (!reminder) {
    throw new ApiError(404, "Reminder not found or unauthorized");
  }

  reminder.status = status;

  if (status === "taken" || status === "missed") {
    reminder.userResponseTime = new Date();
  }

  await reminder.save();

  return res.status(200).json(
    new ApiResponse(200, reminder, "Reminder status updated")
  );
});



const getReminders = asyncHandler(async (req, res) => {
  const userId = req.user.id;


const reminders = await Reminder.find({ userId })
    .populate("medicineId", ["medicineName", "dosage", "frequency"])
    .sort({ time: 1 });

  res.status(200).json(new ApiResponse(200, reminders, "Reminders fetched successfully"));
});


const deleteReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const reminder = await Reminder.findOne({ _id: id, userId });
  if (!reminder) throw new ApiError(404, "Reminder not found");

  await reminder.deleteOne();

 
  await Medicine.updateOne(
    { _id: reminder.medicineId },
    { $pull: { statusHistory: reminder._id } }
  );

  res.status(200).json(new ApiResponse(200, {}, "Reminder deleted successfully"));
});
const markasTaken = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { reminderId } = req.params;

  const reminder = await Reminder.findById(reminderId);
  if (!reminder) throw new ApiError(404, "Reminder not found");

  const medicine = await Medicine.findById(reminder.medicineId);
  if (!medicine || medicine.userId.toString() !== userId)
    throw new ApiError(403, "Not authorized");

  reminder.status = "taken";
  reminder.userResponseTime = new Date();
  await reminder.save();

  medicine.takenCount += 1;
  medicine.status = "taken";
  await medicine.save();

  await learnAndShiftHabit(userId, reminder.medicineId);

  const calendarData = await Calendar.findOne({ userId });
  if (calendarData) {
    await updateMedicineInGoogleCalendar(
      reminder,
      calendarData,
      reminder.time,
      "Taken ✅"
    );
  }

  res.status(200).json(
    new ApiResponse(200, reminder, "Medicine marked as taken")
  );
});
const createPreReminderIfHighRisk = async (reminder, risk) => {
  if (risk <= 0.75) return;

  const preTime = new Date(reminder.time.getTime() - 15 * 60000);
  if (preTime <= new Date()) return;

  const exists = await Reminder.findOne({
    userId: reminder.userId,
    medicineId: reminder.medicineId,
    time: preTime,
  });
  if (exists) return;

  await Reminder.create({
    userId: reminder.userId,
    medicineId: reminder.medicineId,
    time: preTime,
    status: "pending",
  });
};

const markasMissed = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { reminderId } = req.params;

  const reminder = await Reminder.findById(reminderId);
  if (!reminder) throw new ApiError(404, "Reminder not found");

  const medicine = await Medicine.findById(reminder.medicineId);
  if (!medicine || medicine.userId.toString() !== userId)
    throw new ApiError(403, "Not authorized");

  reminder.status = "missed";
  reminder.userResponseTime = new Date();
  await reminder.save();

  medicine.missedCount += 1;
  medicine.status = "missed";
  await medicine.save();

  await handleMissedReminder(reminder._id);

  res.status(200).json(
    new ApiResponse(200, reminder, "Medicine marked as missed")
  );
});
const handleMissedReminder = async (reminderId) => {
  const reminder = await Reminder.findById(reminderId);
  if (!reminder || reminder.status !== "missed") return;

  const scheduledTime = new Date(reminder.time);
  const delay =
    (new Date(reminder.userResponseTime) - scheduledTime) / 60000;

  let risk = 0.5;
  try {
    risk = await predictAdherenceRisk(
      scheduledTime.getHours(),
      scheduledTime.getDay(),
      delay
    );
  } catch (e) {}

    await createPreReminderIfHighRisk(reminder, risk);

  let newTime =
    risk > 0.75
      ? new Date(scheduledTime.getTime() + 30 * 60000)
      : risk > 0.5
      ? new Date(scheduledTime.getTime() + 15 * 60000)
      : suggestNextTime(scheduledTime);

  reminder.time = newTime;
  reminder.status = "pending";
  reminder.userResponseTime = null;
  await reminder.save();

  const safeRisk =
  typeof risk === "number" && !Number.isNaN(risk)
    ? Math.min(Math.max(risk, 0), 1)
    : 0.5; 

  await AIAnalytics.findOneAndUpdate(
    { userId: reminder.userId, medicineId: reminder.medicineId },
    {
      riskLevel: safeRisk,
      lastAnalysis: new Date(),
    },
    { upsert: true }
  );

  await applyPreReminderToFutureDoses(
    reminder.userId,
    reminder.medicineId,
    risk
  );

  const calendarData = await Calendar.findOne({ userId: reminder.userId });
  if (calendarData) {
    await updateMedicineInGoogleCalendar(
      reminder,
      calendarData,
      newTime,
      "Rescheduled ⏰ (AI-adjusted)"
    );
  }
}
const applyPreReminderToFutureDoses = async (userId, medicineId, risk) => {
  if (risk <= 0.75) return;

  const futureReminders = await Reminder.find({
    userId,
    medicineId,
    status: "pending",
    time: { $gt: new Date() },
  });

  for (const r of futureReminders) {
    await createPreReminderIfHighRisk(r, risk);
  }
};
const learnAndShiftHabit = async (userId, medicineId) => {
  const recent = await Reminder.find({
    userId,
    medicineId,
    status: "taken",
    userResponseTime: { $ne: null },
  })
    .sort({ userResponseTime: -1 })
    .limit(1);

  if (recent.length < 3) return;

  const avgDelay =
    recent.reduce(
      (s, r) => s + (r.userResponseTime - r.time),
      0
    ) / recent.length;

  if (avgDelay < 15 * 60000) return;

  const future = await Reminder.find({
    userId,
    medicineId,
    status: "pending",
    time: { $gt: new Date() },
  });

  for (const r of future) {
    r.time = new Date(r.time.getTime() + avgDelay);
    await r.save();
  }
};

export { addReminder, updateReminderStatus, getReminders, deleteReminder ,markasTaken,markasMissed,createPreReminderIfHighRisk,applyPreReminderToFutureDoses,handleMissedReminder,learnAndShiftHabit};