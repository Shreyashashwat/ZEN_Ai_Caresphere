import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalenderView = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;

        if (!token) {
          setError("Please log in to view calendar events");
          setLoading(false);
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
          throw new Error(`Failed to load events (${res.status})`);
        }

        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Failed to load events:", error);
        setError(error.message || "Failed to load calendar events");
      } finally {
        setLoading(false);
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
          <div className="mt-1 flex justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
          </div>
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

  const formatEventTime = (event) => {
    if (event.start?.dateTime) {
      return new Date(event.start.dateTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "All day";
  };

  const isEventToday = (event) => {
    const today = new Date().toISOString().split("T")[0];
    const eventDate = event.start?.dateTime?.split("T")[0] || event.start?.date;
    return eventDate === today;
  };

  return (
    <div className="mx-auto mt-10 max-w-7xl animate-fadeIn overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 shadow-2xl">
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-4 text-white sm:px-8 sm:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold sm:gap-3 sm:text-2xl lg:text-3xl">
              <span className="text-2xl sm:text-3xl">📅</span>
              <span>Calendar Events</span>
            </h2>
            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
              {loading ? "Loading events..." : `${events.length} event${events.length !== 1 ? "s" : ""} synced from Google Calendar`}
            </p>
          </div>
          <div className="hidden rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm sm:block">
            <span className="text-xs font-bold uppercase tracking-wide">Google</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-4 sm:mx-8">
          <div className="mb-3 flex items-center gap-2 text-red-700">
            <span className="text-xl">⚠️</span>
            <span className="font-semibold">{error}</span>
          </div>
          {error.includes("No Google Calendar linked") && (
            <button
              onClick={() => {
                window.location.href = "http://localhost:8000/api/v1/auth/google";
              }}
              className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-95"
            >
              <span className="text-lg">🔗</span>
              Connect to Google Calendar
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2 lg:gap-6">
        {/* Calendar Section */}
        <div className="rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800 sm:text-lg">
              {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="rounded-lg border-2 border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 transition-all duration-200 hover:bg-blue-100"
            >
              Today
            </button>
          </div>
          
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-sm text-gray-600">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              className="react-calendar w-full rounded-xl border-2 border-blue-100 shadow-sm"
            />
          )}
        </div>

        {/* Events List Section */}
        <div className="rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-md sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b-2 border-blue-100 pb-3">
            <h3 className="text-base font-bold text-gray-800 sm:text-lg">
              📆 {selectedDate.toDateString()}
            </h3>
            {dayEvents.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 sm:max-h-[500px]">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-gray-600">Loading events...</p>
                </div>
              </div>
            ) : dayEvents.length > 0 ? (
              dayEvents.map((e) => {
                const isToday = isEventToday(e);
                return (
                  <div
                    key={e.id}
                    className={`group rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                      isToday
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-blue-100 bg-blue-50/50 hover:bg-blue-50"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="flex-1 text-base font-bold text-gray-800">
                        {e.summary || "Untitled Event"}
                      </h4>
                      {isToday && (
                        <span className="whitespace-nowrap rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-800">
                          Today
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>⏰</span>
                        <span className="font-medium">{formatEventTime(e)}</span>
                      </span>
                      
                      {e.location && (
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          <span className="font-medium">{e.location}</span>
                        </span>
                      )}
                    </div>

                    {e.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                        {e.description}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-8">
                <div className="text-center">
                  <div className="mb-2 inline-flex rounded-full bg-blue-100 p-3">
                    <span className="text-2xl">📭</span>
                  </div>
                  <p className="font-semibold text-gray-700">No Events</p>
                  <p className="text-sm text-gray-600">No events scheduled for this date</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalenderView;
