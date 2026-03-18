import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Example: Dates with medicines taken or missed
  const medicineHistory = {
    "2025-10-01": "taken",
    "2025-10-02": "missed",
    "2025-10-03": "upcoming",
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const key = date.toISOString().split("T")[0];
      if (medicineHistory[key] === "taken") return "bg-green-200 rounded-full";
      if (medicineHistory[key] === "missed") return "bg-red-200 rounded-full";
      if (medicineHistory[key] === "upcoming") return "bg-blue-200 rounded-full";
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
            <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mx-2 align-middle"></span> Upcoming
        </div>
    </div>
);
};

export default CalendarView;