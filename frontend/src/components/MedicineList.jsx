import React, { useState, useEffect } from "react";
import { markasTaken, markasMissed, deleteMedicine } from "../api";

const MedicineList = ({ medicines, reminders = [], onUpdate, onEdit }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000); // re-render every 30s
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    Taken: "bg-green-100 text-green-800",
    Missed: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
  };

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
      const status = r.status?.toLowerCase();

      return (
        r.medicineId._id === medicine._id &&
        status === "pending" &&
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
    return <p className="text-gray-500 text-center mt-10">No medicines added yet.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="sticky top-0 bg-white pb-2 z-10">
        <h2 className="text-2xl font-bold text-gray-700 text-center">
          💊 Your Medicines
        </h2>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2 scroll-smooth space-y-4 mt-4 border border-gray-200 rounded-2xl p-4 shadow-sm bg-gray-50">
        {medicines.map((m) => {
          const reminderDue = isReminderDue(m);

          return (
            <div
              key={m._id}
              className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl shadow border ${
                m._id === nextMedicineId
                  ? "bg-indigo-50 border-indigo-300 shadow-lg"
                  : "bg-white border-gray-100"
              } hover:shadow-xl transition duration-200`}
            >
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-lg font-semibold text-indigo-600">
                  {m.medicineName || m.name}
                </h3>
                <p className="text-gray-600">{m.dosage}</p>
                <p className="text-gray-500 text-sm">{m.frequency}</p>
              </div>

              <div className="mt-3 sm:mt-0">
                <span
                  className={`px-3 py-1 rounded-full font-semibold ${
                    statusColors[m.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {m.status || "Pending"}
                </span>
              </div>

              <div className="mt-3 sm:mt-0 flex flex-wrap gap-2 justify-center">
                {reminderDue ? (
                  <>
                    <button
                      onClick={() => handleMarkTaken(m)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full transition duration-200"
                    >
                      Mark as Taken
                    </button>
                    <button
                      onClick={() => handleMarkMissed(m)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-full transition duration-200"
                    >
                      Mark as Missed
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onEdit && onEdit(m)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-full transition duration-200"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m._id)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded-full transition duration-200"
                >
                  Delete
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