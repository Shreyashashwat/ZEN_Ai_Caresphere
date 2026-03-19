import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";
import { getMedicines, fetchHistory, getReminders, deleteMedicine } from "../api";

const Patient = () => {
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [nextReminder, setNextReminder] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  // Fetch Data
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
      const sorted = (res.data.data || []).sort(
        (a, b) => new Date(a.time) - new Date(b.time)
      );
      setHistory([...sorted]);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await getReminders();
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      data.sort((a, b) => new Date(a.time) - new Date(b.time));
      data.forEach((r) => {
        if (r.status) r.status = r.status.toLowerCase();
      });
      setReminders([...data]);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  };

  // Delete medicine handler
  const handleDeleteMedicine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await deleteMedicine(id);
      await handleMedicineUpdate();
    } catch (err) {
      console.error("Failed to delete medicine:", err);
    }
  };

  // Next reminder logic
  useEffect(() => {
    const now = new Date();
    const upcoming = reminders
      .filter((r) => r.medicineId)
      .find((r) => new Date(r.time) >= now && r.status === "pending");
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
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const username =
    JSON.parse(localStorage.getItem("user"))?.username || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">

      {/* 🌟 Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-indigo-100 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide flex items-center gap-2">
            <span className="text-blue-500">💊</span> CareSphere
          </h1>
          <button
            onClick={handleLogout}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 hover:scale-105"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 🩺 Welcome Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-none sm:rounded-3xl p-8 shadow-lg mt-6 mx-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold mb-2">
              Welcome back, <span className="font-bold">{username} 👋</span>
            </h2>
            <p className="text-white/90 text-sm sm:text-base">
              Here’s your personalized health dashboard.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-center bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4">
            <p className="text-sm text-white/80">Next Reminder</p>
            <p className="text-2xl font-bold mt-1">
              {nextReminder
                ? `${new Date(nextReminder.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} — ${nextReminder.medicineId?.medicineName}`
                : "No upcoming reminders"}
            </p>
          </div>
        </div>
      </section>

      {/* 💊 Medicine Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ➕ Add/Edit Medicine */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-8 rounded-3xl shadow-xl border border-gray-200 transition-all hover:shadow-2xl flex flex-col">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              ➕ Add / Edit Medicine
            </h2>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
            <MedicineForm
              onSuccess={handleMedicineUpdate}
              medicine={selectedMedicine}
            />
          </div>
          </div>

        {/* 💊 Medicine List */}
         <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50">
         
            <MedicineList
              medicines={medicines}
              reminders={reminders}
              onUpdate={handleMedicineUpdate}
              onEdit={setSelectedMedicine}
            />
          </div>
      </section>

      {/* 📅 Calendar */}
      <section className="max-w-7xl mx-auto px-6">
       <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50  rounded-3xl shadow-xl border border-gray-200 transition-all hover:shadow-2xl flex flex-col">
          
          <CalendarView key={refreshTrigger} reminders={reminders} />
        </div>
      </section>

      {/* 📊 Dashboard & History */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-8 rounded-3xl shadow-xl border border-gray-200 transition-all hover:shadow-2xl flex flex-col">
          <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
            📊 Progress Overview
          </h2>
          <DashboardChart key={refreshTrigger} history={history} />
        </div>

      <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-8 rounded-3xl shadow-xl border border-gray-200 transition-all hover:shadow-2xl flex flex-col">
          <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2 justify-center">
            📘 Dose History
          </h2>
          <HistoryTable history={history} />
          </div>
      </section>

      {/* ⚙️ Footer */}
      <footer className="text-center mt-12 py-6 text-sm text-gray-500 border-t border-gray-200">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-indigo-600">CareSphere</span> — Built for Better Health 🩺
      </footer>
    </div>
  );
};

export default Patient;