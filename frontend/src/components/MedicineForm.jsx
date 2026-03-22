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
  const [medicineValid, setMedicineValid] = useState(true);
  const [checkingMedicine, setCheckingMedicine] = useState(false);

  useEffect(() => {
    if (medicine) {
      setFormData({
        medicineName: medicine.medicineName || "",
        dosage: medicine.dosage || "",
        frequency: medicine.frequency || "daily",
        time: medicine.time || [""],
        startDate: medicine.startDate
          ? new Date(medicine.startDate).toISOString().split("T")[0] : "",
        endDate: medicine.endDate
          ? new Date(medicine.endDate).toISOString().split("T")[0] : "",
      });
      setIsEditing(true);
    }
  }, [medicine]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "medicineName") {
      validateMedicineName(value);
    }
  };

  // Validate medicine via backend
  let timeout;
  const validateMedicineName = (name) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      if (!name) {
        setMedicineValid(true);
        return;
      }
      setCheckingMedicine(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/medicine/validate-medicine/${encodeURIComponent(
            name
          )}`
        );
        const data = await res.json();
        setMedicineValid(data.valid);
      } catch (err) {
        setMedicineValid(false);
      } finally {
        setCheckingMedicine(false);
      }
    }, 500);
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.time];
    newTimes[index] = value;
    setFormData({ ...formData, time: newTimes });
  };

  const addTimeField = () =>
    setFormData({ ...formData, time: [...formData.time, ""] });

  const removeTimeField = (index) =>
    setFormData({ ...formData, time: formData.time.filter((_, i) => i !== index) });

  const showSuccess = (msg) => {
    setSuccessMsg(msg); setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };
  const showError = (msg) => {
    setErrorMsg(msg); setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicineValid) {
      alert("Please enter a valid medicine name.");
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) {
        showError("User not found. Please log in again.");
        setLoading(false);
        return;
      }

      const medicineData = {
        ...formData,
        userId: user._id,
      };

      let medicineId;
      const wasEditing = isEditing;
      const savedFormData = { ...formData }; // snapshot before reset

      if (isEditing) {
        const res = await updateMedicine(medicine._id, medicineData);
        medicineId = res.data.data._id;
      } else {
        const res = await addMedicine(medicineData);
        medicineId = res.data.data._id;
        alert("Medicine added successfully!");

        // Add reminders for new medicine
        for (const t of formData.time) {
          const start = new Date(formData.startDate);
          const end = formData.endDate ? new Date(formData.endDate) : start;

          const step =
            formData.frequency === "daily"
              ? 1
              : formData.frequency === "weekly"
              ? 7
              : 0;

          for (
            let d = new Date(start);
            step > 0 && d <= end;
            d.setDate(d.getDate() + step)
          ) {
            const [hours, minutes] = t.split(":");
            const reminderTime = new Date(d);
            reminderTime.setHours(hours, minutes, 0, 0);

            await addReminder({
              medicineId,
              time: reminderTime.toISOString(),
            });
          }

          if (formData.frequency === "as needed") {
            const [hours, minutes] = t.split(":");
            const reminderTime = new Date(start);
            reminderTime.setHours(hours, minutes, 0, 0);
            await addReminder({
              medicineId,
              time: reminderTime.toISOString(),
              status: "pending",
            });
          }
        }
      }

      // Reset form
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

      showSuccess(wasEditing ? "Medicine updated!" : "Medicine added!");

      
      if (!wasEditing) {
        (async () => {
          try {
            for (const t of savedFormData.time) {
              const start = new Date(savedFormData.startDate);
              const end = savedFormData.endDate ? new Date(savedFormData.endDate) : start;
              const step = savedFormData.frequency === "daily" ? 1
                : savedFormData.frequency === "weekly" ? 7 : 0;

              for (let d = new Date(start); step > 0 && d <= end; d.setDate(d.getDate() + step)) {
                const [hours, minutes] = t.split(":");
                const reminderTime = new Date(d);
                reminderTime.setHours(hours, minutes, 0, 0);
                await addReminder({ medicineId, time: reminderTime.toISOString() });
              }

              if (savedFormData.frequency === "as needed") {
                const [hours, minutes] = t.split(":");
                const reminderTime = new Date(start);
                reminderTime.setHours(hours, minutes, 0, 0);
                await addReminder({ medicineId, time: reminderTime.toISOString(), status: "pending" });
              }
            }
            
            if (onSuccess) onSuccess();
          } catch (err) {
            console.warn("⚠️ Background reminder creation error:", err.message);
          }
        })();
      }

    } catch (err) {
      console.error(err);
      showError("Failed to save medicine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full animate-fadeIn overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-3xl"
    >
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 text-white">
        <div className="mb-2 inline-flex rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
          <span className="text-xs font-bold uppercase tracking-wide">
            {isEditing ? "✏️ Edit Mode" : "💊 New Entry"}
          </span>
        </div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          {isEditing ? "Update Medication" : "Add New Medication"}
        </h2>
        <p className="mt-1 text-sm text-blue-100">
          AI-powered medication management for better health outcomes
        </p>
      </div>

      <div className="space-y-6 p-8">
        <div className="group">
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Medicine Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="medicineName"
              placeholder="e.g., Aspirin, Metformin, Lisinopril"
              value={formData.medicineName}
              onChange={handleChange}
              className={`w-full rounded-xl border-2 px-4 py-3.5 font-medium shadow-sm transition duration-200 focus:outline-none focus:ring-4 ${
                medicineValid
                  ? "border-blue-200 bg-white focus:border-blue-400 focus:ring-blue-100"
                  : "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
              }`}
              required
            />
            {checkingMedicine && (
              <div className="absolute right-3 top-3.5 flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></span>
                <span className="text-xs font-semibold text-blue-700">Validating...</span>
              </div>
            )}
          </div>
          {!medicineValid && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-all">
              <span className="text-base">⚠️</span> 
              <span>Medicine not found in our database</span>
            </div>
          )}
          {medicineValid && formData.medicineName && !checkingMedicine && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-all">
              <span className="text-base">✓</span> 
              <span>Medicine verified successfully</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Dosage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="dosage"
            placeholder="e.g., 500mg, 2 tablets, 5ml"
            value={formData.dosage}
            onChange={handleChange}
            className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3.5 font-medium shadow-sm transition duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Frequency <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full appearance-none rounded-xl border-2 border-blue-200 bg-white px-4 py-3.5 font-medium shadow-sm transition duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="daily">📅 Daily - Every day</option>
              <option value="weekly">📆 Weekly - Once per week</option>
              <option value="as needed">🔔 As Needed - When required</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-800">
            ⏰ Reminder Time(s) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {formData.time.map((t, index) => (
              <div
                key={index}
                className="group flex items-center gap-3 transition-all duration-200"
              >
                <div className="relative flex-1">
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3.5 font-medium shadow-sm transition duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-blue-600">
                    <span className="text-lg">⏱️</span>
                  </div>
                </div>
                {formData.time.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeField(index)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 font-bold text-red-600 shadow-sm transition duration-200 hover:bg-red-100 hover:shadow"
                    aria-label="Remove time"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addTimeField}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 px-4 py-3 text-sm font-bold text-blue-600 shadow-sm transition duration-200 hover:border-blue-400 hover:bg-blue-100 hover:shadow"
          >
            <span className="text-xl">+</span> Add Another Reminder Time
          </button>
        </div>

        <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/30 p-5">
          <label className="mb-3 block text-sm font-bold text-gray-800">
            Schedule Duration
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3.5 font-medium shadow-sm transition duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600">
                End Date <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3.5 font-medium shadow-sm transition duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !medicineValid}
          className={`group relative mt-6 w-full overflow-hidden rounded-xl py-4 font-bold shadow-lg transition-all duration-300 ${
            loading || !medicineValid
              ? "cursor-not-allowed bg-gray-300 text-gray-500"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-300"
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-base">
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                <span>Processing...</span>
              </>
            ) : isEditing ? (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Update Medicine</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Medicine & Set Reminders</span>
              </>
            )}
          </span>
          {!loading && !(!medicineValid) && (
            <span className="absolute inset-0 -z-0 bg-gradient-to-r from-indigo-600 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
          )}
        </button>
      </div>
    </form>
  );
};

export default MedicineForm;