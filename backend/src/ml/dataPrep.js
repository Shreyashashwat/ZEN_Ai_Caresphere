import { Reminder } from "../model/reminderstatus.js";
export const getTrainingData = async () => {
  const reminders = await Reminder.find().lean();

  return reminders.map(r => {
    const date = new Date(r.time);
    return {
      hour: date.getHours(),
      dayOfWeek: date.getDay(),
      delay: r.userResponseTime
        ? (new Date(r.userResponseTime) - date) / 60000
        : null,
      status: r.status === "missed" ? 1 : 0, // 1 = missed, 0 = taken
    };
  });
};
