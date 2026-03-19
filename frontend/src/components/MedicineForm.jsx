import React, { useEffect, useState } from "react";
import { addMedicine, updateMedicine, addReminder } from "../api";

const MedicineForm = ({ onSuccess, medicine }) => {
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    frequency: "daily",
    time: [""],
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!medicine?._id);

  // Fill form if editing
  useEffect(() => {
    if (medicine) {
      setFormData({
        medicineName: medicine.medicineName || "",
        dosage: medicine.dosage || "",
        frequency: medicine.frequency || "daily",
        time: medicine.time || [""],
        startDate: medicine.startDate
          ? new Date(medicine.startDate).toISOString().split("T")[0]
          : "",
        endDate: medicine.endDate
          ? new Date(medicine.endDate).toISOString().split("T")[0]
          : "",
      });
      setIsEditing(true);
    }
  }, [medicine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.time];
    newTimes[index] = value;
    setFormData({ ...formData, time: newTimes });
  };

  const addTimeField = () =>
    setFormData({ ...formData, time: [...formData.time, ""] });

  const removeTimeField = (index) => {
    const newTimes = formData.time.filter((_, i) => i !== index);
    setFormData({ ...formData, time: newTimes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) {
        alert("User not found. Please log in again.");
        setLoading(false);
        return;
      }

      const medicineData = { ...formData, userId: user._id };
      let medicineId;

      if (isEditing) {
        const res = await updateMedicine(medicine._id, medicineData);
        medicineId = res.data.data._id;
        alert("Medicine updated successfully!");
      } else {
        const res = await addMedicine(medicineData);
        medicineId = res.data.data._id;
        alert("Medicine added successfully!");

        // Add reminders only for new medicine
        for (const t of formData.time) {
          const start = new Date(formData.startDate);
          const end = formData.endDate ? new Date(formData.endDate) : start;

          const step =
            formData.frequency === "daily"
              ? 1
              : formData.frequency === "weekly"
              ? 7
              : 0;

          for (let d = new Date(start); step > 0 && d <= end; d.setDate(d.getDate() + step)) {
            const [hours, minutes] = t.split(":");
            const reminderTime = new Date(d);
            reminderTime.setHours(hours, minutes, 0, 0);

            await addReminder({ medicineId, time: reminderTime.toISOString() });
          }

          if (formData.frequency === "as needed") {
            const [hours, minutes] = t.split(":");
            const reminderTime = new Date(start);
            reminderTime.setHours(hours, minutes, 0, 0);
            await addReminder({ medicineId, time: reminderTime.toISOString() });
          }
        }
      }

      // Reset form and editing mode
      setFormData({
        medicineName: "",
        dosage: "",
        frequency: "daily",
        time: [""],
        startDate: "",
        endDate: "",
      });
      setIsEditing(false);

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save medicine or reminders");
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
        {isEditing ? "Update Medicine" : "Add Medicine"}
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
        {loading
          ? "Saving..."
          : isEditing
          ? "Update Medicine"
          : "Save Medicine & Reminders"}
      </button>
    </form>
  );
};

export default MedicineForm;