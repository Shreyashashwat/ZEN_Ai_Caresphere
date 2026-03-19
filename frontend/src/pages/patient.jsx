import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";

import { getMedicines, fetchHistory, getReminders } from "../api";

const Patient = () => {
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [nextReminder, setNextReminder] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchMedicines = async () => {
    try {
      const res = await getMedicines();
      setMedicines(Array.isArray(res.data.data) ? [...res.data.data] : []);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const res = await fetchHistory();
      const sortedHistory = (res.data.data || []).sort(
        (a, b) => new Date(a.time) - new Date(b.time)
      );
      setHistory([...sortedHistory]);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await getReminders();
      const remindersArray = Array.isArray(res.data.data) ? res.data.data : [];
      remindersArray.sort((a, b) => new Date(a.time) - new Date(b.time));
      remindersArray.forEach(r => { if (r.status) r.status = r.status.toLowerCase(); });
      setReminders([...remindersArray]);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  };

  // Determine next reminder
  useEffect(() => {
    const now = new Date();
    const upcoming = reminders
      .filter(r => r.medicineId)
      .find(r => new Date(r.time) >= now && r.status === "pending");
    setNextReminder(upcoming || null);
  }, [reminders]);

  // Initial fetch
  useEffect(() => {
    fetchMedicines();
    fetchHistoryData();
    fetchReminders();
  }, []);

  const handleMedicineUpdate = async () => {
    await Promise.all([fetchMedicines(), fetchHistoryData(), fetchReminders()]);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-md border-b border-indigo-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4 sm:gap-0">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide">
            Care<span className="text-blue-500">Sphere</span>
          </h1>
          <button
            onClick={handleLogout}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Welcome & Next Reminder */}
        <section className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-3xl p-8 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <div>
            <h2 className="text-3xl font-semibold mb-2">
              Welcome back,{" "}
              <span className="font-bold">
                {JSON.parse(localStorage.getItem("user"))?.username || "User"} 👋
              </span>
            </h2>
            <p className="text-white/90">Here’s your personalized health summary.</p>
          </div>
          <div className="mt-4 sm:mt-0 text-center">
            <p className="text-lg font-semibold">Next Reminder:</p>
            <p className="text-2xl font-bold mt-1">
              {nextReminder
                ? `${new Date(nextReminder.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} — ${nextReminder.medicineId?.medicineName} 💊`
                : "No upcoming reminders"}
            </p>
          </div>
        </section>

        {/* Add / List Medicines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              ➕ Add / Edit Medicine
            </h2>
            <MedicineForm onSuccess={handleMedicineUpdate} medicine={selectedMedicine} />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              💊 Medicine List
            </h2>
            <MedicineList
              medicines={medicines}
              reminders={reminders}
              onUpdate={handleMedicineUpdate}
              onEdit={setSelectedMedicine}
            />
          </div>
        </div>

        {/* Dashboard, Calendar, History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                📊 Progress Overview
              </h2>
              <DashboardChart key={refreshTrigger} history={history} />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                📅 Calendar
              </h2>
              <CalendarView key={refreshTrigger} reminders={reminders} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition">
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