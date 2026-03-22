import React, { useState, useEffect } from "react";
import { markasTaken, markasMissed, deleteMedicine } from "../api";

const MedicineList = ({ medicines, reminders = [], onUpdate, onEdit }) => {
  const [tick, setTick] = useState(0);
  const [highlighted, setHighlighted] = useState({});

  // Filter out AI-adjusted pre-reminders (created 15 min before actual dose)
  const filterOutPreReminders = (remindersList) => {
    return remindersList.filter(reminder => {
      const reminderTime = new Date(reminder.time).getTime();
      const hasMainReminder = remindersList.some(r => {
        const rTime = new Date(r.time).getTime();
        const timeDiff = rTime - reminderTime;
        return timeDiff === 900000 && 
               (r.medicineId?._id || r.medicineId) === (reminder.medicineId?._id || reminder.medicineId);
      });
      return !hasMainReminder;
    });
  };

  const actualReminders = filterOutPreReminders(reminders);

  // Re-render every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);
  

  // Auto-mark missed reminders
  useEffect(() => {
    const checkMissedReminders = async () => {
      const now = new Date();
      const overdueReminders = actualReminders.filter((r) => {
        if (!r?.medicineId || !r.time) return false;
        const reminderTime = new Date(r.time);
        const oneHourLater = new Date(reminderTime.getTime() + 60 * 60000);
        return r.status?.toLowerCase() === "pending" && oneHourLater <= now;
      });

      for (const r of overdueReminders) {
        try {
          await markasMissed(r._id);
          console.log("Auto-marked as missed:", r._id);
        } catch (err) {
          console.error("Auto-miss failed", err);
        }
      }
      if (overdueReminders.length > 0) onUpdate();
    };

    checkMissedReminders();
  }, [tick, reminders, onUpdate]);

  // Get next medicine (upcoming)
  const getNextMedicineId = () => {
    const now = new Date();
    let next = null;
    actualReminders.forEach((r) => {
      if (!r || !r.medicineId) return;
      const reminderTime = new Date(r.time);
      if (reminderTime > now && (!next || reminderTime < new Date(next.time))) {
        next = { _id: r.medicineId._id, time: r.time };
      }
    });
    return next?._id;
  };
  const nextMedicineId = getNextMedicineId();

  const isReminderDue = (medicine) => {
    const now = new Date();
    return actualReminders.some((r) => {
      if (!r?.medicineId) return false;
      const reminderTime = new Date(r.time);
      return (
        r.medicineId._id === medicine._id &&
        r.status?.toLowerCase() === "pending" &&
        reminderTime <= now
      );
    });
  };

  const handleMarkTaken = async (medicine) => {
    try {
      const reminder = actualReminders.find((r) => {
        if (!r?.medicineId) return false;
        const reminderTime = new Date(r.time);
        return (
          r.medicineId._id === medicine._id &&
          r.status?.toLowerCase() === "pending" &&
          reminderTime <= new Date()
        );
      });

      if (reminder) {
        await markasTaken(reminder._id);
        setHighlighted((p) => ({ ...p, [medicine._id]: "taken" }));
        setTimeout(
          () => setHighlighted((p) => ({ ...p, [medicine._id]: null })),
          3000
        );
        onUpdate();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to mark as taken");
    }
  };

  const handleMarkMissed = async (medicine) => {
    try {
      const reminder = actualReminders.find((r) => {
        if (!r?.medicineId) return false;
        const reminderTime = new Date(r.time);
        return (
          r.medicineId._id === medicine._id &&
          r.status?.toLowerCase() === "pending" &&
          reminderTime <= new Date()
        );
      });

      if (reminder) {
        await markasMissed(reminder._id);
        setHighlighted((p) => ({ ...p, [medicine._id]: "missed" }));
        setTimeout(
          () => setHighlighted((p) => ({ ...p, [medicine._id]: null })),
          3000
        );
        onUpdate();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to mark as missed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await deleteMedicine(id);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to delete medicine.");
    }
  };

  if (!medicines || medicines.length === 0)
    return (
      <div className="mx-auto mt-12 max-w-md animate-fadeIn text-center">
        <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-12">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4">
            <span className="text-4xl">💊</span>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-700">No Medicines Yet</h3>
          <p className="text-sm text-gray-600">
            Start by adding your first medication above
          </p>
        </div>
      </div>
    );

  return (
    <div className="mx-auto mt-10 w-full animate-fadeIn overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 shadow-2xl">
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-4 sm:px-8 sm:py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl font-extrabold">
              <span className="text-2xl sm:text-3xl">💊</span>
              <span className="hidden sm:inline">Your Medications</span>
              <span className="sm:hidden">Medications</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-blue-100">
              {medicines.length} medication{medicines.length !== 1 ? 's' : ''} 
              {medicines.length > 5 && <span className="hidden sm:inline"> • Scroll to view all</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-wide">Active</span>
            </div>
            {medicines.length > 5 && (
              <span className="text-xs text-blue-200 hidden sm:inline">↓ Scroll</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-[400px] sm:max-h-[500px] lg:max-h-[650px] space-y-3 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
        {medicines.map((m) => {
          const reminderDue = isReminderDue(m);
          const highlight = highlighted[m._id];
          const isUpcoming = m._id === nextMedicineId;

          let cardStyle = "border-2 transition-all duration-300 hover:shadow-lg";
          let statusBadge = null;

          if (highlight === "taken") {
            cardStyle += " bg-green-50 border-green-400 shadow-md";
            statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                <span>✓</span> Taken
              </span>
            );
          } else if (highlight === "missed") {
            cardStyle += " bg-red-50 border-red-400 shadow-md";
            statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                <span>✕</span> Missed
              </span>
            );
          } else if (reminderDue) {
            cardStyle += " bg-yellow-50 border-yellow-400 shadow-lg ring-2 ring-yellow-300 animate-pulse";
            statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                <span>⏰</span> Due Now
              </span>
            );
          } else if (isUpcoming) {
            cardStyle += " bg-blue-50 border-blue-400 shadow-md";
            statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                <span>📅</span> Next Up
              </span>
            );
          } else {
            cardStyle += " bg-white border-blue-100";
          }

          return (
            <div
              key={m._id}
              className={`flex flex-col gap-3 rounded-xl p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between ${cardStyle}`}
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                    {m.medicineName || m.name}
                  </h3>
                  {statusBadge}
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-gray-700">💉</span>
                    <span className="font-medium">{m.dosage}</span>
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-gray-700">📆</span>
                    <span className="font-medium capitalize">{m.frequency}</span>
                  </span>
                  {m.time && m.time.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-700">⏰</span>
                      <span className="font-medium">{m.time.slice(0, 3).join(", ")}{m.time.length > 3 ? '...' : ''}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:flex-nowrap">
                {reminderDue ? (
                  <>
                    <button
                      onClick={() => handleMarkTaken(m)}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-3 py-2 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap"
                    >
                      <span>✓</span> <span className="hidden sm:inline">Mark</span> Taken
                    </button>
                    <button
                      onClick={() => handleMarkMissed(m)}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap"
                    >
                      <span>✕</span> Missed
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onEdit && onEdit(m)}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 text-xs sm:text-sm font-bold text-blue-700 transition-all duration-200 hover:bg-blue-100 whitespace-nowrap"
                  >
                    <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m._id)}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm font-bold text-red-600 transition-all duration-200 hover:bg-red-100 whitespace-nowrap"
                >
                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicineList;
