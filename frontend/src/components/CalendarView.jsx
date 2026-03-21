import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalenderView = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;

        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        const res = await fetch("http://localhost:8000/api/v1/google/events", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Failed response:", errorText);
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    };

    loadEvents();
  }, []);

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      const hasEvent = events.some(
        (e) =>
          e.start?.dateTime?.startsWith(dateStr) ||
          e.start?.date?.startsWith(dateStr)
      );

      if (hasEvent) {
        return (
          <div className="bg-indigo-500 rounded-full w-2 h-2 mx-auto mt-1"></div>
        );
      }
    }
    return null;
  };

  const dayEvents = events.filter((e) => {
    const eventDate =
      e.start?.dateTime?.split("T")[0] || e.start?.date;
    return eventDate === selectedDate.toISOString().split("T")[0];
  });

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-8 rounded-3xl shadow-xl border border-gray-200 flex flex-col">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700 flex items-center gap-2">
        📅 Google Calendar Events
      </h2>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1 bg-white rounded-2xl shadow-inner border p-4 flex justify-center">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            className="react-calendar w-full border-none"
          />
        </div>

        <div className="flex-1 bg-white p-6 rounded-2xl shadow-inner border">
          <h3 className="text-lg font-semibold text-indigo-700 mb-4">
            🗓️ Events on {selectedDate.toDateString()}
          </h3>

          {dayEvents.length > 0 ? (
            <ul className="space-y-3 max-h-[380px] overflow-y-auto">
              {dayEvents.map((e) => (
                <li
                  key={e.id}
                  className="p-4 border rounded-xl bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  <p className="font-medium text-indigo-700">
                    {e.summary || "No Title"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    🕒{" "}
                    {new Date(
                      e.start.dateTime || e.start.date
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              No events for this date.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalenderView;