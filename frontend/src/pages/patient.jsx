import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";
import CaregiverList from "../components/CaregiverList";
import {
  getMedicines,
  fetchHistory,
  getReminders,
  deleteMedicine,
  getAllDoctors,
  sendDoctorRequest,
  getPatientRequests,
} from "../api";

const Patient = () => {
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [nextReminder, setNextReminder] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Doctor Integration State
  const [doctors, setDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState("home");
  const [weeklyInsights, setWeeklyInsights] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "User";

  // --- Data Fetching Functions ---

  const fetchWeeklyInsights = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/weekly-insights/${user._id}`);
      const data = await res.json();
      setWeeklyInsights(data?.insights || []);
    } catch (err) {
      console.error("Failed to fetch weekly insights", err);
    }
  };

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

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await getAllDoctors();
      setDoctors(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await getPatientRequests();
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  // --- Handlers ---

  const handleSendRequest = async (doctorId) => {
    try {
      await sendDoctorRequest(doctorId);
      alert("Request sent successfully!");
      fetchRequests();
    } catch (err) {
      console.error("Failed to send request:", err);
      alert("Failed to send request");
    }
  };

  const getRequestStatus = (doctorId) => {
    const req = requests.find((r) => r.doctor?._id === doctorId || r.doctor === doctorId);
    return req ? req.status : null;
  };

  const handleMedicineUpdate = async () => {
    await Promise.all([fetchMedicines(), fetchHistoryData(), fetchReminders()]);
    setRefreshTrigger((prev) => prev + 1);
    setSelectedMedicine(null); // Clear selection after update
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // --- Side Effects ---

  useEffect(() => {
    fetchMedicines();
    fetchHistoryData();
    fetchReminders();
    fetchDoctors();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "insights") {
      fetchWeeklyInsights();
    }
  }, [activeTab]);

  useEffect(() => {
    const now = new Date();
    const upcoming = reminders
      .filter((r) => r.medicineId)
      .find((r) => new Date(r.time) >= now && r.status === "pending");
    setNextReminder(upcoming || null);
  }, [reminders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      
      {/* 🌟 Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-indigo-100 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide flex items-center gap-2">
            <span className="text-blue-500">💊</span> CareSphere
          </h1>
          <div className="flex gap-4 items-center mt-4 sm:mt-0">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTab === "home" ? "bg-indigo-600 text-white" : "text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTab === "insights" ? "bg-indigo-600 text-white" : "text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              Health Insights
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 hover:scale-105"
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
            <p className="text-xl font-bold mt-1">
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

      {activeTab === "home" && (
        <>
          {/* CONNECTIVITY SECTION (Doctors & Caregivers) */}
          <section className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-2 gap-8">
            {/* DOCTOR REQUESTS */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                🩺 Connect with Doctors
              </h2>
              {loadingDoctors ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-8 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-slate-600">No doctors available.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {doctors.map((doc) => {
                    const status = getRequestStatus(doc._id);
                    return (
                      <div key={doc._id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors bg-slate-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-slate-800">{doc.username}</h3>
                            <p className="text-sm text-slate-500">{doc.email}</p>
                          </div>
                          {status === "ACCEPTED" && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Connected</span>
                          )}
                        </div>
                        <button
                          disabled={status === "PENDING" || status === "ACCEPTED"}
                          onClick={() => handleSendRequest(doc._id)}
                          className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                            status === "ACCEPTED"
                              ? "hidden"
                              : status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700 cursor-default"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow"
                          }`}
                        >
                          {status === "PENDING" ? "⏳ Request Pending" : "Send Connection Request"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CAREGIVERS SECTION */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
              <CaregiverList />
            </div>
          </section>

          {/* 💊 Medicine Section */}
          <section className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-8 rounded-3xl shadow-xl border border-gray-200">
              <h2 className="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                ➕ Add / Edit Medicine
              </h2>
              <MedicineForm
                onSuccess={handleMedicineUpdate}
                medicine={selectedMedicine}
              />
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200">
              <h2 className="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                📋 Your Medications
              </h2>
              <MedicineList
                medicines={medicines}
                reminders={reminders}
                onEdit={setSelectedMedicine}
                onUpdate={handleMedicineUpdate}
              />
            </div>
          </section>

          {/* 📊 Dashboard & History */}
          <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4">📊 Progress</h2>
              <DashboardChart key={refreshTrigger} history={history} />
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4">📅 Calendar</h2>
              <CalendarView reminders={reminders} />
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4">📘 History</h2>
              <HistoryTable history={history} />
            </div>
          </section>
        </>
      )}

      {activeTab === "insights" && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-indigo-700 mb-8 flex items-center gap-2">
            🧠 Weekly Health Insights
          </h2>
          {weeklyInsights.length === 0 ? (
            <p className="text-gray-500">No insights available yet. Please check back after weekly analysis.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weeklyInsights.map((insight, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      {insight.category}
                    </span>
                    <span className={`text-xs font-semibold ${
                        insight.priority === "high" ? "text-red-600" : insight.priority === "medium" ? "text-yellow-600" : "text-green-600"
                      }`}>
                      {insight.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="text-center mt-12 py-6 text-sm text-gray-500 border-t border-gray-200">
        © {new Date().getFullYear()} <span className="font-semibold text-indigo-600">CareSphere</span> — Built for Better Health 🩺
      </footer>
    </div>
  );
};

export default Patient;