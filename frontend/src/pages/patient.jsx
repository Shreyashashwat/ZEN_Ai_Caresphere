
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";

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

  // Appointment
  const [showAptModal, setShowAptModal] = useState(false);
  const [aptDoctor, setAptDoctor] = useState(null);
  const [aptForm, setAptForm] = useState({ date: "", time: "", problem: "" });

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "User";

  // -------------------- FETCH --------------------
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
      setMedicines(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const res = await fetchHistory();
      const sorted = (res.data.data || []).sort((a, b) => new Date(a.time) - new Date(b.time));
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
    const req = patientRequests.find((r) => (r.doctorId?._id || r.doctorId) === doctorId);
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
              className={`px-4 py-2 rounded-full text-m font-medium transition ${
                activeTab === "home" ? "bg-indigo-600 text-white" : "text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-2 rounded-full text-m font-medium transition ${
                activeTab === "insights" ? "bg-indigo-600 text-white" : "text-indigo-600 hover:bg-indigo-100"
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
                          className={`w-full py-2.5 rounded-xl font-bold transition ${
                            status === "PENDING" 
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

          {/* ANALYTICS & HISTORY */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-gray-50">
               <h3 className="font-bold text-gray-700 mb-4">Adherence Progress</h3>
               <DashboardChart key={refreshTrigger} history={history} />
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-gray-50">
               <h3 className="font-bold text-gray-700 mb-4">Medication Calendar</h3>
               <CalendarView reminders={reminders} />
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-gray-50 overflow-y-auto max-h-[400px]">
               <h3 className="font-bold text-gray-700 mb-4">Recent Activity</h3>
               <HistoryTable history={history} />
            </div>
          </section>
        </main>
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
                    <span className={`text-xs font-black ${
                      insight.priority === "high" ? "text-red-500" : insight.priority === "medium" ? "text-yellow-600" : "text-green-500"
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
                      onChange={(e) => setAptForm({...aptForm, date: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Time</label>
                    <input 
                      type="time" 
                      required 
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                      onChange={(e) => setAptForm({...aptForm, time: e.target.value})} 
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
                  onChange={(e) => setAptForm({...aptForm, problem: e.target.value})} 
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