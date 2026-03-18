import React, { useState } from "react";
import { addMedicine, addReminder } from "../api";

const MedicineForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    frequency: "daily",
    time: [""], // multiple times possible
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);

  // handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handle time input changes
  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.time];
    newTimes[index] = value;
    setFormData({ ...formData, time: newTimes });
  };

  // add another time input
  const addTimeField = () => {
    setFormData({ ...formData, time: [...formData.time, ""] });
  };

  // remove a time input
  const removeTimeField = (index) => {
    const newTimes = formData.time.filter((_, i) => i !== index);
    setFormData({ ...formData, time: newTimes });
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) {
        alert(" User not found. Please log in again.");
        return;
      }

      const data = { ...formData, userId: user._id };
      await addMedicine(data);
      alert("Medicine added successfully!");
        // 1️⃣ Add medicine
      const medicineData = { ...formData, userId: user._id };
      const res = await addMedicine(medicineData);
    const medicineId =res.data.data._id;

      // 2️⃣ Add reminders for each time
      for (const t of formData.time) {
        const start = new Date(formData.startDate);
        const end = formData.endDate ? new Date(formData.endDate) : start;

        const step = formData.frequency === "daily" ? 1 : formData.frequency === "weekly" ? 7 : 0;

        for (let d = new Date(start); step > 0 && d <= end; d.setDate(d.getDate() + step)) {
          const [hours, minutes] = t.split(":");
          const reminderTime = new Date(d);
          reminderTime.setHours(hours, minutes, 0, 0);

          await addReminder({
            medicineId,
            time: reminderTime.toISOString(),
          });
        }

        // For "as needed", just create one reminder per time
        if (formData.frequency === "as needed") {
          const [hours, minutes] = t.split(":");
          const reminderTime = new Date(start);
          reminderTime.setHours(hours, minutes, 0, 0);

          await addReminder({
            medicineId,
            time: reminderTime.toISOString(),
          });
        }
      }

      alert("Medicine and reminders added successfully!");

      // reset form
      setFormData({
        medicineName: "",
        dosage: "",
        frequency: "daily",
        time: [""],
        startDate: "",
        endDate: "",
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to add medicine or reminders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-5"
    >
      <h2 className="text-2xl font-semibold text-gray-700 text-center">
        Add Medicine
      </h2>

      <input
        type="text"
        name="medicineName"
        placeholder="Medicine Name"
        value={formData.medicineName}
        onChange={handleChange}
        className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
        required
      />

      <input
        type="text"
        name="dosage"
        placeholder="Dosage (e.g., 500mg)"
        value={formData.dosage}
        onChange={handleChange}
        className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
        required
      />

      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">Time(s):</label>
        {formData.time.map((t, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="time"
              value={t}
              onChange={(e) => handleTimeChange(index, e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
              required
            />
            {formData.time.length > 1 && (
              <button
                type="button"
                onClick={() => removeTimeField(index)}
                className="text-red-500 hover:text-red-700"
              >
                ✖
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTimeField}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          + Add another time
        </button>
      </div>

      <select
        name="frequency"
        value={formData.frequency}
        onChange={handleChange}
        className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="as needed">As Needed</option>
      </select>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-gray-700 font-medium">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="flex-1">
          <label className="block text-gray-700 font-medium">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
          {loading ? "Saving..." : "Save Medicine & Reminders"}
      </button>
    </form>
  );
};

export default MedicineForm;