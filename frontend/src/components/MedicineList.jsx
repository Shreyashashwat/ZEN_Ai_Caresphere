import React from "react";
import { updateMedicine, deleteMedicine } from "../api";

const MedicineList = ({ medicines, onUpdate, onEdit }) => {
  const statusColors = {
    Taken: "bg-green-100 text-green-800",
    Missed: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
  };

  // ✅ Find next upcoming medicine
  const getNextMedicineId = () => {
    const now = new Date();
    let next = null;

    medicines.forEach((m) => {
      const times = Array.isArray(m.time) ? m.time : [m.time];
      times.forEach((t) => {
        const medicineTime = new Date(t);
        if (medicineTime > now && (!next || medicineTime < new Date(next.time))) {
          next = { ...m, time: t };
        }
      });
    });
    return next?._id;
  };

  const nextMedicineId = getNextMedicineId();

  // ✅ Update medicine status
  const updateStatus = async (id, status) => {
    try {
      await updateMedicine(id, { status });
      onUpdate();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update medicine status.");
    }
  };

  // ✅ Delete medicine
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await deleteMedicine(id);
      onUpdate();
    } catch (err) {
      console.error("Error deleting medicine:", err);
      alert("Failed to delete medicine.");
    }
  };

  // ✅ Check if reminder time has come or passed
  const isReminderTime = (m) => {
    const now = new Date();
    const times = Array.isArray(m.time) ? m.time : [m.time];
    return times.some((t) => new Date(t) <= now);
  };

  if (!medicines || medicines.length === 0)
    return <p className="text-gray-500 text-center mt-10">No medicines added yet.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
        💊 Your Medicines
      </h2>

      {medicines.map((m) => {
        const reminderDue = isReminderTime(m);

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
              <p className="text-gray-500 text-sm">
                {Array.isArray(m.time) ? m.time.join(", ") : m.time} • {m.frequency}
              </p>
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
                    onClick={() => updateStatus(m._id, "Taken")}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full transition duration-200"
                  >
                    Mark as Taken
                  </button>
                  <button
                    onClick={() => updateStatus(m._id, "Missed")}
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
  );
};

export default MedicineList;