import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarView = ({ reminders = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});

  useEffect(() => {
    const data = {};
    reminders.forEach((r) => {
      if (!r.time || !r.status) return;
      const dateKey = new Date(r.time).toISOString().split("T")[0];
      const status = r.status.toLowerCase();

     
      if (!data[dateKey]) {
        data[dateKey] = status === "pending" ? "upcoming" : status;
      } else if (status === "missed") {
        data[dateKey] = "missed";
      } else if (status === "pending" && data[dateKey] !== "missed") {
        data[dateKey] = "upcoming";
      } else if (status === "taken" && !["missed", "upcoming"].includes(data[dateKey])) {
        data[dateKey] = "taken";
      }
    });
    setCalendarData(data);
  }, [reminders]);

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const key = date.toISOString().split("T")[0];
      const status = calendarData[key];
      if (status === "taken") return "bg-green-200 rounded-full";
      if (status === "missed") return "bg-red-200 rounded-full";
      if (status === "upcoming") return "bg-pink-200 rounded-full";
    }
    return "";
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Medicine Calendar</h2>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileClassName={tileClassName}
        className="react-calendar w-full"
      />
      <p className="mt-4 text-gray-700 font-medium">
        Selected Date: <span className="font-mono">{selectedDate.toDateString()}</span>
      </p>
      <div className="mt-2 text-sm text-gray-500">
        <span className="inline-block w-3 h-3 bg-green-200 rounded-full mr-1 align-middle"></span> Taken
        <span className="inline-block w-3 h-3 bg-red-200 rounded-full mx-2 align-middle"></span> Missed
        <span className="inline-block w-3 h-3 bg-pink-200 rounded-full mx-2 align-middle"></span> Upcoming
      </div>
    </div>
  );
};

export default CalendarView;