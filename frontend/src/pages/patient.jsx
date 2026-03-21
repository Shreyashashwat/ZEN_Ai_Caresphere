import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateStatsReport } from '../utils/reportGenerator';

import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";
import CaregiverList from "../components/CaregiverList";
import AlertView from "../components/Caregiver/AlertView";

import {
  getMedicines,
  fetchHistory,
  getReminders,
  getAllDoctors,
  sendDoctorRequest,
  getPatientRequests,
  createAppointment,
} from "../api";

const Patient = () => {
  const navigate = useNavigate();

  // -------------------- STATES --------------------
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [nextReminder, setNextReminder] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [doctors, setDoctors] = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [weeklyInsights, setWeeklyInsights] = useState([]);

  // Appointment States
  const [showAptModal, setShowAptModal] = useState(false);
  const [aptDoctor, setAptDoctor] = useState(null);
  const [aptForm, setAptForm] = useState({ date: "", time: "", problem: "" });

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "User";

  // -------------------- FETCHERS --------------------
  const fetchWeeklyInsights = async () => {
    try {
      const userId = user?._id;
      if (!userId) {
        setWeeklyInsights([]);
        return;
      }
      const res = await fetch(`http://localhost:3000/api/weekly-insights/${userId}`);
      const data = await res.json();
      setWeeklyInsights(data?.insights || []);
    } catch (err) {
      console.error("Failed to fetch weekly insights", err);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await getMedicines();
      setMedicines(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const res = await fetchHistory();
      const historyPayload = Array.isArray(res.data.data)
        ? res.data.data
        : res.data.data?.history || [];
      const sorted = historyPayload.sort((a, b) => new Date(a.time) - new Date(b.time));
      setHistory(sorted);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await getReminders();
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      data.sort((a, b) => new Date(a.time) - new Date(b.time));
      data.forEach((r) => r.status && (r.status = r.status.toLowerCase()));
      setReminders(data);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await getAllDoctors();
      setDoctors(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchPatientRequests = async () => {
    try {
      const res = await getPatientRequests();
      setPatientRequests(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch patient requests:", err);
    }
  };

  const handleDownloadReport = () => {
    const statsData = {
      totalMedicines: medicines.length,
      takenCount: history.filter(h => h.status === "taken").length,
      missedCount: history.filter(h => h.status === "missed").length,
      adherenceRate: history.length > 0
        ? Math.round((history.filter(h => h.status === "taken").length / history.length) * 100)
        : 0,
      medicineStats: medicines.map(med => {
        const medHistory = history.filter(h => h.medicineId?._id === med._id || h.medicineId === med._id);
        const taken = medHistory.filter(h => h.status === "taken").length;
        const total = medHistory.length;
        return {
          name: med.medicineName,
          taken,
          total,
          adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
        };
      }),
    };

    generateStatsReport(statsData, username);
  };

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    fetchMedicines();
    fetchHistoryData();
    fetchReminders();
    fetchDoctors();
    fetchPatientRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "insights") fetchWeeklyInsights();
  }, [activeTab]);

  useEffect(() => {
    const now = new Date();
    const upcoming = reminders
      .filter((r) => r.medicineId)
      .find((r) => new Date(r.time) >= now && r.status === "pending");
    setNextReminder(upcoming || null);
  }, [reminders]);

  // -------------------- HANDLERS --------------------
  const handleMedicineUpdate = async () => {
    await Promise.all([fetchMedicines(), fetchHistoryData(), fetchReminders()]);
    setSelectedMedicine(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSendRequest = async (doctorId) => {
    try {
      await sendDoctorRequest(doctorId);
      await fetchPatientRequests();
      alert("Request sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleAptSubmit = async (e) => {
    e.preventDefault();
    try {
      const appointmentDate = new Date(`${aptForm.date}T${aptForm.time}`);
      await createAppointment({
        doctorId: aptDoctor._id,
        appointmentDate,
        problem: aptForm.problem,
      });
      alert("Appointment requested successfully!");
      setShowAptModal(false);
      setAptForm({ date: "", time: "", problem: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to schedule appointment");
    }
  };

  const getRequestStatus = (doctorId) => {
    const req = patientRequests.find((r) => {
      const reqDoctorId = r.doctorId?._id || r.doctorId;
      return reqDoctorId?.toString() === doctorId?.toString();
    });
    return req?.status || null;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-3xl font-extrabold text-indigo-700">
            Care<span className="text-blue-500">Sphere</span>
          </h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-full text-m font-medium transition ${activeTab === "home" ? "bg-indigo-600 text-white" : "text-indigo-600 hover:bg-indigo-100"
                }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`px-4 py-2 rounded-full text-m font-medium transition ${activeTab === "family" ? "bg-rose-500 text-white" : "text-rose-500 hover:bg-rose-50"
                }`}
            >
              💕 Family
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 rounded-full text-m font-medium transition cursor-pointer ${activeTab === "stats" ? "bg-emerald-500 text-white" : "text-emerald-600 hover:bg-emerald-50"
                }`}
            >
              📊 Stats
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-2 rounded-full text-m font-medium transition cursor-pointer ${activeTab === "insights" ? "bg-indigo-600 text-white" : "text-indigo-600 hover:bg-indigo-100"
                }`}
            >
              Health Insights
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 hover:scale-105"
          >
            Logout
          </button>
        </div>
      </header>

      {/* WELCOME SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-8 bg-indigo-600 text-white rounded-3xl mt-6 shadow-xl">
        <h2 className="text-3xl font-bold">Welcome back, {username} 👋</h2>
        <div className="flex items-center gap-3 mt-2 text-indigo-100">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
            Next Reminder
          </span>
          <p>
            {nextReminder
              ? `${new Date(nextReminder.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} — ${nextReminder.medicineId?.medicineName}`
              : "No upcoming reminders"}
          </p>
        </div>
      </section>

      {activeTab === "home" ? (
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
          {/* DOCTOR CONNECT SECTION */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-indigo-800">🩺 Healthcare Network</h2>
                <p className="text-gray-500 text-sm">Connect with professionals and schedule visits.</p>
              </div>
            </div>
            {loadingDoctors ? (
              <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doc) => {
                  const status = getRequestStatus(doc._id);
                  return (
                    <div key={doc._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-xl mb-4">👨‍⚕️</div>
                      <h3 className="font-bold text-lg text-gray-800">{doc.username}</h3>
                      <p className="text-sm text-gray-500 mb-6">{doc.email}</p>

                      {status === "ACCEPTED" ? (
                        <button
                          onClick={() => { setAptDoctor(doc); setShowAptModal(true); }}
                          className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          📅 Book Appointment
                        </button>
                      ) : (
                        <button
                          disabled={status === "PENDING"}
                          onClick={() => handleSendRequest(doc._id)}
                          className={`w-full py-2.5 rounded-xl font-bold transition ${status === "PENDING"
                            ? "bg-yellow-50 text-yellow-600 border border-yellow-200 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            }`}
                        >
                          {status === "PENDING" ? "⏳ Connection Pending" : "Connect with Doctor"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* MEDICINE MANAGEMENT */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6 flex items-center gap-2">
                ➕ New Medication
              </h2>
              <MedicineForm onSuccess={handleMedicineUpdate} medicine={selectedMedicine} />
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 overflow-hidden">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6 px-2">📋 Current Regimen</h2>
              <MedicineList
                medicines={medicines}
                reminders={reminders}
                onUpdate={handleMedicineUpdate}
                onEdit={setSelectedMedicine}
              />
            </div>
          </section>

          {/* CALENDAR */}
          <section className="bg-white p-6 rounded-3xl shadow-lg border border-gray-50">
            <h3 className="font-bold text-gray-700 mb-4">📅 Medication Calendar</h3>
            <CalendarView reminders={reminders} />
          </section>
        </main>
      ) : activeTab === "family" ? (
        /* FAMILY CIRCLE */
        <section className="max-w-5xl mx-auto px-6 py-12 space-y-8">
          {/* Pending Invites Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📬 Pending Family Invites
              </h2>
              <p className="text-amber-100 text-sm">Accept invites from family members who want you in their health circle</p>
            </div>
            <div className="p-2">
              <AlertView />
            </div>
          </div>

          {/* My Family Circle Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8">
            <CaregiverList />
          </div>

          {/* Family Benefits Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border border-rose-100">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-bold text-rose-700 mb-2">Real-time Alerts</h3>
              <p className="text-sm text-gray-600">Family members get notified about missed medications and health updates.</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border border-rose-100">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-rose-700 mb-2">Health Monitoring</h3>
              <p className="text-sm text-gray-600">Your family can view your medication adherence and health progress.</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border border-rose-100">
              <div className="text-3xl mb-3">💌</div>
              <h3 className="font-bold text-rose-700 mb-2">Stay Connected</h3>
              <p className="text-sm text-gray-600">Keep loved ones in the loop about your wellness journey.</p>
            </div>
          </div>
        </section>
      ) : activeTab === "stats" ? (
        /* PREMIUM VITAL STATISTICS SECTION */
        <section className="max-w-7xl mx-auto px-6 py-12 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-4xl font-black text-indigo-900 tracking-tight flex items-center gap-3">
                📊 Vital Metrics
              </h2>
              <p className="text-gray-500 font-medium ml-1 mt-1 uppercase text-[10px] tracking-[0.2em]">Comprehensive Health Analysis Profile</p>
            </div>
            <button
              onClick={handleDownloadReport}
              className="group px-6 py-3.5 bg-indigo-600 text-white rounded-[1.25rem] font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
            >
              <span className="text-lg group-hover:animate-bounce">📥</span>
              Export Clinical Report
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Medications", value: medicines.length, icon: "💊", color: "from-blue-600 to-indigo-600" },
              { label: "Doses Taken", value: history.filter(h => h.status === "taken").length, icon: "✅", color: "from-emerald-500 to-teal-600" },
              { label: "Doses Missed", value: history.filter(h => h.status === "missed").length, icon: "⚠️", color: "from-rose-500 to-red-600" },
              {
                label: "Adherence",
                value: `${history.length > 0 ? Math.round((history.filter(h => h.status === "taken").length / history.length) * 100) : 0}%`,
                icon: "📈",
                color: "from-cyan-500 to-blue-500"
              },
            ].map((stat, i) => (
              <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${stat.color} p-8 rounded-[2rem] shadow-2xl group`}>
                <div className="absolute -right-4 -top-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">{stat.icon}</div>
                <div className="relative z-10">
                  <div className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-5xl font-black text-white">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Visual Analytics */}
            <div className="lg:col-span-2 space-y-10">
              <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/40 ring-1 ring-black/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">📈 Weekly Performance</h3>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">Live Update</div>
                </div>
                <div className="h-[350px]">
                  <DashboardChart key={refreshTrigger + "stats"} history={history} />
                </div>
              </div>

              {/* Medicine Breakdown */}
              <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/40 ring-1 ring-black/5">
                <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter mb-8">💊 Treatment Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {medicines.map((med) => {
                    const medHistory = history.filter(h => h.medicineId?._id === med._id || h.medicineId === med._id);
                    const medTaken = medHistory.filter(h => h.status === "taken").length;
                    const medTotal = medHistory.length;
                    const medRate = medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 0;

                    return (
                      <div key={med._id} className="bg-white/80 p-6 rounded-3xl shadow-lg border border-indigo-50 group hover:border-indigo-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-indigo-900 text-lg">{med.medicineName}</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{med.dosage}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-black ${medRate >= 80 ? 'bg-emerald-50 text-emerald-600' : medRate >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                            {medRate}%
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${medRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : medRate >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-rose-400 to-red-500'}`}
                              style={{ width: `${medRate}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                            <span>Compliance</span>
                            <span>{medTaken} / {medTotal} Doses</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Side Terminal: Activity Log */}
            <div className="space-y-8">
              <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 text-9xl text-white opacity-5 rotate-12 transition-transform duration-700 group-hover:rotate-0">📋</div>
                <div className="relative z-10">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                    Activity Log
                  </h3>
                  <div className="space-y-4">
                    {history.slice(-12).reverse().map((h, i) => (
                      <div key={i} className="flex items-center gap-4 border-l-2 border-indigo-700/50 pl-4 py-1 hover:border-indigo-400 transition-colors">
                        <span className="text-xl shrink-0">{h.status === "taken" ? "✅" : "⚠️"}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate text-indigo-50">
                            {h.medicineId?.medicineName || "Dose"}
                          </p>
                          <p className="text-[10px] font-bold text-indigo-300 uppercase leading-none">
                            {new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(h.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center py-10 opacity-40 italic text-sm">No activity recorded</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Score Component */}
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-8 rounded-[2.5rem] shadow-2xl text-white">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-80 text-center">Protocol Integrity Score</h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364.4"
                        strokeDashoffset={364.4 - (364.4 * (history.length > 0 ? (history.filter(h => h.status === "taken").length / history.length) : 0))}
                        className="text-white transition-all duration-1000 ease-out" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black">
                        {history.length > 0 ? Math.round((history.filter(h => h.status === "taken").length / history.length) * 100) : 0}
                      </span>
                    </div>
                  </div>
                  <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/70 text-center leading-relaxed">
                    Based on your medication consistency over the last cycle
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* HEALTH INSIGHTS */
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-indigo-700 mb-8 flex items-center gap-2">
            🧠 AI Health Insights
          </h2>
          {weeklyInsights.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Our AI is analyzing your data. Check back in a few days for your weekly report.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weeklyInsights.map((insight, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:scale-[1.02] transition-transform">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 font-bold uppercase tracking-wider">{insight.category}</span>
                    <span className={`text-xs font-black ${insight.priority === "high" ? "text-red-500" : insight.priority === "medium" ? "text-yellow-600" : "text-green-500"
                      }`}>
                      {insight.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed font-medium">{insight.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* --- APPOINTMENT BOOKING --- */}
      {showAptModal && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-indigo-50">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-indigo-800">New Appointment</h2>
                <p className="text-sm text-gray-500">Scheduling with <span className="text-indigo-600 font-bold">Dr. {aptDoctor?.username}</span></p>
              </div>
              <button onClick={() => setShowAptModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleAptSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                    onChange={(e) => setAptForm({ ...aptForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Time</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                    onChange={(e) => setAptForm({ ...aptForm, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Reason for Visit</label>
                <textarea
                  required
                  placeholder="Tell the doctor what's bothering you..."
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm font-medium"
                  rows="4"
                  onChange={(e) => setAptForm({ ...aptForm, problem: e.target.value })}
                ></textarea>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
                >
                  Confirm Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center mt-20 py-10 text-xs text-gray-400 border-t border-indigo-50">
        <div className="flex justify-center gap-6 mb-4">
          <span className="hover:text-indigo-600 cursor-pointer transition">Privacy Policy</span>
          <span className="hover:text-indigo-600 cursor-pointer transition">Terms of Service</span>
          <span className="hover:text-indigo-600 cursor-pointer transition">Contact Support</span>
        </div>
        © {new Date().getFullYear()} <span className="font-bold text-indigo-300">CareSphere Digital Health</span>
      </footer>
    </div>
  );
};

export default Patient;
