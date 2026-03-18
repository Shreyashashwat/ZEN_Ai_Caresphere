import React, { useEffect, useState } from "react";
import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";

import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getHistory,
  getReminders,
} from "../api";

const Patient = () => {
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [nextReminder, setNextReminder] = useState(null);

  // Fetch medicines from backend
  const fetchMedicines = async () => {
    try {
      const { data } = await getMedicines();
      setMedicines(data.medicines || []);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    }
  };

  // Fetch history
  const fetchHistoryData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const { data } = await getHistory(user._id);
      // Sort by time
      const sortedHistory = data.sort((a, b) => new Date(a.time) - new Date(b.time));
      setHistory(sortedHistory);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  // Fetch reminders
  const fetchReminders = async () => {
    try {
      const { data } = await getReminders();
      setReminders(data);
      if (data.length > 0) {
        // Assuming reminders are sorted by time
        setNextReminder(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchHistoryData();
    fetchReminders();
  }, []);

  // Callback after adding or updating a medicine
  const handleMedicineUpdate = () => {
    fetchMedicines();
    fetchHistoryData();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload(); // redirect to login
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md shadow-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide">
            Care<span className="text-blue-500">Sphere</span> Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium transition duration-200 shadow"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Welcome + Next Reminder */}
        <section className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-3xl p-8 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold mb-2">
              Welcome back,{" "}
              <span className="font-bold">
                {JSON.parse(localStorage.getItem("user"))?.username || "User"} 👋
              </span>
            </h2>
            <p className="text-white/90">
              Here’s your personalized health and medicine summary.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-center">
            <p className="text-lg font-semibold">Next Reminder:</p>
            <p className="text-2xl font-bold">
              {nextReminder
                ? `${new Date(nextReminder.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} — ${nextReminder.medicationId?.medicineName} 💊`
                : "No upcoming reminders"}
            </p>
          </div>
        </section>

        {/* Add / List Medicines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              ➕ Add / Edit Medicine
            </h2>
            <MedicineForm onSuccess={handleMedicineUpdate} />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              💊 Medicine List
            </h2>
            <MedicineList medicines={medicines} onUpdate={handleMedicineUpdate} />
          </div>
        </div>

        {/* Dashboard Charts + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                📊 Progress Overview
              </h2>
              <DashboardChart history={history} />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                📅 Calendar
              </h2>
              <CalendarView reminders={reminders} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2 text-center">
              📘 Dose History
            </h2>
            <HistoryTable history={history} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center mt-12 py-6 text-sm text-gray-500 border-t border-gray-200">
        © {new Date().getFullYear()} CareSphere — Built for better health 🩺
      </footer>
    </div>
  );
};

export default Patient;