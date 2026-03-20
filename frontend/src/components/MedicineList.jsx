import React, { useState, useEffect } from "react";
import { markasTaken, markasMissed, deleteMedicine } from "../api";

const MedicineList = ({ medicines, reminders = [], onUpdate, onEdit }) => {
  const [tick, setTick] = useState(0);
  const [highlighted, setHighlighted] = useState({});

  // Re-render every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);
  

  // Auto-mark missed reminders
  useEffect(() => {
    const checkMissedReminders = async () => {
      const now = new Date();
      const overdueReminders = reminders.filter((r) => {
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
    reminders.forEach((r) => {
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
    return reminders.some((r) => {
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
      const reminder = reminders.find((r) => {
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
      const reminder = reminders.find((r) => {
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
      <p className="text-gray-500 text-center mt-12 text-lg">
        No medicines added yet.
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 rounded-3xl shadow-2xl 
                    bg-gradient-to-br from-indigo-50 via-white to-purple-50 
                    border border-indigo-100">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center gap-2 justify-center">
        💊 Medicine List
      </h2>

      <div className="max-h-96 overflow-y-auto pr-2 scroll-smooth space-y-4 mt-4 border border-gray-200 rounded-2xl p-4 shadow-sm bg-gray-50">
        {medicines.map((m) => {
          const reminderDue = isReminderDue(m);
          const highlight = highlighted[m._id];

          let cardStyle = "";
          if (highlight === "taken") cardStyle = "bg-green-100 border-green-400 shadow-md";
          else if (highlight === "missed") cardStyle = "bg-red-100 border-red-400 shadow-md";
          else if (m._id === nextMedicineId) cardStyle = "bg-indigo-50 border-indigo-300 shadow-lg";
          else cardStyle = "bg-white border-gray-100";

          return (
            <div
              key={m._id}
              className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl shadow border transition duration-300 ${cardStyle}`}
            >
              <div>
                <h3 className="text-xl font-semibold text-indigo-700">
                  {m.medicineName || m.name}
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  Dosage: <span className="font-medium">{m.dosage}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Frequency: <span className="font-medium">{m.frequency}</span>
                </p>
              </div>

              <div className="mt-3 sm:mt-0 flex flex-wrap gap-2 justify-center">
                {reminderDue ? (
                  <>
                    <button
                      onClick={() => handleMarkTaken(m)}
                      className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow transition-all duration-300 hover:scale-[1.05]"
                    >
                      ✅ Mark Taken
                    </button>
                    <button
                      onClick={() => handleMarkMissed(m)}
                      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow transition-all duration-300 hover:scale-[1.05]"
                    >
                      ❌ Mark Missed
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onEdit && onEdit(m)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow transition-all duration-300 hover:scale-[1.05]"
                  >
                    ✏️ Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m._id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-xl text-sm font-medium shadow transition-all duration-300 hover:scale-[1.05]"
                >
                  🗑️ Delete
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