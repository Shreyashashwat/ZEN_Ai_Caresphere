import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateStatsReport, generateWeeklyReport } from '../utils/reportGenerator';

import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";
import CaregiverList from "../components/CaregiverList";
import AlertsView from "../components/Caregiver/AlertsView";

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

  // Activity Log States for Large Data
  const [activityLogPage, setActivityLogPage] = useState(1);
  const [activityLogItemsPerPage, setActivityLogItemsPerPage] = useState(15);
  const [activityLogFilter, setActivityLogFilter] = useState("all"); // all, taken, missed
  const [activityLogSearch, setActivityLogSearch] = useState("");
  const [activityLogSort, setActivityLogSort] = useState("newest"); // newest, oldest

  // Treatment Overview States for Large Data
  const [treatmentOverviewPage, setTreatmentOverviewPage] = useState(1);
  const [treatmentOverviewItemsPerPage, setTreatmentOverviewItemsPerPage] = useState(6);
  const [treatmentOverviewSearch, setTreatmentOverviewSearch] = useState("");
  const [treatmentOverviewSort, setTreatmentOverviewSort] = useState("name"); // name, adherence

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "User";

  // -------------------- FETCHERS --------------------
  const fetchWeeklyInsights = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/weekly-insights/${user._id}`);
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

  const handleDownloadWeeklyReport = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const weeklyHistory = history.filter(h => new Date(h.time) >= sevenDaysAgo);
    
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayHistory = weeklyHistory.filter(h => {
        const hDate = new Date(h.time);
        return hDate.toDateString() === date.toDateString();
      });
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        taken: dayHistory.filter(h => h.status === 'taken').length,
        missed: dayHistory.filter(h => h.status === 'missed').length,
        total: dayHistory.length,
      });
    }
    
    const weeklyStats = {
      totalMedicines: medicines.length,
      weeklyTaken: weeklyHistory.filter(h => h.status === 'taken').length,
      weeklyMissed: weeklyHistory.filter(h => h.status === 'missed').length,
      weeklyAdherence: weeklyHistory.length > 0
        ? Math.round((weeklyHistory.filter(h => h.status === 'taken').length / weeklyHistory.length) * 100)
        : 0,
      dailyBreakdown: dailyData,
      medicinePerformance: medicines.map(med => {
        const medWeeklyHistory = weeklyHistory.filter(h => h.medicineId?._id === med._id || h.medicineId === med._id);
        const taken = medWeeklyHistory.filter(h => h.status === 'taken').length;
        const total = medWeeklyHistory.length;
        return {
          name: med.medicineName,
          taken,
          missed: medWeeklyHistory.filter(h => h.status === 'missed').length,
          total,
          adherence: total > 0 ? Math.round((taken / total) * 100) : 0,
        };
      }).filter(med => med.total > 0),
    };
    
    generateWeeklyReport(weeklyStats, username);
  };

  // const fetchHistoryData = async () => {
  //   try {
  //     const res = await fetchHistory();
  //     const sorted = (res.data.data || []).sort((a, b) => new Date(a.time) - new Date(b.time));
  //     setHistory(sorted);
  //   } catch (err) {
  //     console.error("Failed to fetch history:", err);
  //   }
  // };
// const fetchHistoryData = async () => {
//   try {
//     const res = await fetchHistory();

//     console.log("🔍 [fetchHistoryData] res.data:", res.data);
//     console.log("🔍 [fetchHistoryData] res.data.data:", res.data.data);
//     console.log("🔍 [fetchHistoryData] res.data.data.data:", res.data.data?.data);

//     // Backend returns: { data: { data: [...], stats: {} } }
//     const historyArray = res.data.data?.data || [];

//     console.log("✅ [fetchHistoryData] historyArray length:", historyArray.length);
//     console.log("✅ [fetchHistoryData] Is array?", Array.isArray(historyArray));

//     const sorted = historyArray.sort((a, b) => new Date(b.time) - new Date(a.time));
//     setHistory(sorted);
//   } catch (err) {
//     console.error("Failed to fetch history:", err);
//   }
// };
const fetchHistoryData = async () => {
  try {
    const res = await fetchHistory();
    const historyArray = res.data.data?.data || [];

    console.log("🔍 [Patient] Total records fetched:", historyArray.length);
    console.log("🔍 [Patient] Sample record:", historyArray[0]);
    console.log("🔍 [Patient] All statuses:", [...new Set(historyArray.map(h => h.status))]); // unique statuses
    console.log("🔍 [Patient] Records with no status:", historyArray.filter(h => !h.status).length);

    // Filter out AI pre-reminders (15 min before main reminder)
    const filterOutPreReminders = (historyList) => {
      return historyList.filter(historyItem => {
        const itemTime = new Date(historyItem.time).getTime();
        const hasMainReminder = historyList.some(h => {
          const hTime = new Date(h.time).getTime();
          const timeDiff = hTime - itemTime;
          // Check if there's a reminder 15 minutes after this one for the same medicine
          return timeDiff === 900000 && 
                 (h.medicineId?._id || h.medicineId) === (historyItem.medicineId?._id || historyItem.medicineId);
        });
        return !hasMainReminder;
      });
    };

    const filtered = filterOutPreReminders(historyArray);
    console.log("🔍 [Patient] After filtering pre-reminders:", filtered.length);

    const sorted = filtered
      .map(h => ({ ...h, status: h.status?.toLowerCase() }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));

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
    // Filter out AI pre-reminders for next reminder display
    const filterOutPreReminders = (remindersList) => {
      return remindersList.filter(reminder => {
        const reminderTime = new Date(reminder.time).getTime();
        const hasMainReminder = remindersList.some(r => {
          const rTime = new Date(r.time).getTime();
          const timeDiff = rTime - reminderTime;
          return timeDiff === 900000 && 
                 (r.medicineId?._id || r.medicineId) === (reminder.medicineId?._id || reminder.medicineId);
        });
        return !hasMainReminder;
      });
    };
    
    const filteredReminders = filterOutPreReminders(reminders);
    const upcoming = filteredReminders
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

  // Activity Log Processing Functions
  const getFilteredAndSearchedHistory = () => {
    let filtered = history;

    // Filter by status
    if (activityLogFilter !== "all") {
      filtered = filtered.filter(h => h.status === activityLogFilter);
    }

    // Filter by search term
    if (activityLogSearch.trim()) {
      filtered = filtered.filter(h =>
        h.medicineId?.medicineName?.toLowerCase().includes(activityLogSearch.toLowerCase())
      );
    }

    // Sort
    if (activityLogSort === "oldest") {
      filtered = filtered.sort((a, b) => new Date(a.time) - new Date(b.time));
    } else {
      filtered = filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    }

    return filtered;
  };

  const filteredActivityLog = getFilteredAndSearchedHistory();
  const totalActivityRecords = filteredActivityLog.length;
  const totalActivityPages = Math.ceil(totalActivityRecords / activityLogItemsPerPage);
  const activityLogStartIndex = (activityLogPage - 1) * activityLogItemsPerPage;
  const activityLogEndIndex = activityLogStartIndex + activityLogItemsPerPage;
  const paginatedActivityLog = filteredActivityLog.slice(activityLogStartIndex, activityLogEndIndex);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setActivityLogPage(1);
  }, [activityLogFilter, activityLogSearch, activityLogSort]);

  // Treatment Overview Processing Functions
  const getFilteredAndSortedMedicines = () => {
    let filtered = medicines;

    // Filter by search term
    if (treatmentOverviewSearch.trim()) {
      filtered = filtered.filter(m =>
        m.medicineName?.toLowerCase().includes(treatmentOverviewSearch.toLowerCase())
      );
    }

    // Sort
    if (treatmentOverviewSort === "adherence") {
      filtered = filtered.sort((a, b) => {
        const aHistory = history.filter(h => h.medicineId?._id === a._id || h.medicineId === a._id);
        const bHistory = history.filter(h => h.medicineId?._id === b._id || h.medicineId === b._id);
        const aRate = aHistory.length > 0 ? aHistory.filter(h => h.status === "taken").length / aHistory.length : 0;
        const bRate = bHistory.length > 0 ? bHistory.filter(h => h.status === "taken").length / bHistory.length : 0;
        return bRate - aRate; // Highest adherence first
      });
    } else {
      filtered = filtered.sort((a, b) => a.medicineName.localeCompare(b.medicineName));
    }

    return filtered;
  };

  const filteredTreatmentMedicines = getFilteredAndSortedMedicines();
  const totalTreatmentRecords = filteredTreatmentMedicines.length;
  const totalTreatmentPages = Math.ceil(totalTreatmentRecords / treatmentOverviewItemsPerPage);
  const treatmentStartIndex = (treatmentOverviewPage - 1) * treatmentOverviewItemsPerPage;
  const treatmentEndIndex = treatmentStartIndex + treatmentOverviewItemsPerPage;
  const paginatedTreatmentMedicines = filteredTreatmentMedicines.slice(treatmentStartIndex, treatmentEndIndex);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setTreatmentOverviewPage(1);
  }, [treatmentOverviewSearch, treatmentOverviewSort]);

  // Calculate stats for quick view
  const adherenceRate = history.length > 0 
    ? Math.round((history.filter(h => h.status === 'taken').length / history.length) * 100)
    : 0;
  
  // Filter out AI-adjusted pre-reminders (reminders created 15 min before the actual dose)
  const filterOutPreReminders = (remindersList) => {
    return remindersList.filter(reminder => {
      // Check if there's another reminder for the same medicine exactly 15 minutes after this one
      const reminderTime = new Date(reminder.time).getTime();
      const hasMainReminder = remindersList.some(r => {
        const rTime = new Date(r.time).getTime();
        const timeDiff = rTime - reminderTime;
        // If there's a reminder 15 minutes (900000ms) after this one for the same medicine, this is a pre-reminder
        return timeDiff === 900000 && 
               (r.medicineId?._id || r.medicineId) === (reminder.medicineId?._id || reminder.medicineId);
      });
      return !hasMainReminder; // Keep only if it's NOT a pre-reminder
    });
  };
  
  const todayReminders = filterOutPreReminders(reminders.filter(r => {
    const rDate = new Date(r.time);
    const today = new Date();
    return rDate.toDateString() === today.toDateString();
  })).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ENHANCED HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-md border-b border-indigo-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white text-2xl font-extrabold">C</span>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent tracking-tight">
              CareSphere
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 ${
                activeTab === "home" 
                  ? "bg-white text-indigo-700 shadow-lg" 
                  : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 ${
                activeTab === "history" 
                  ? "bg-white text-blue-700 shadow-lg" 
                  : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
              }`}
            >
              📋 History
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 ${
                activeTab === "insights" 
                  ? "bg-white text-purple-700 shadow-lg" 
                  : "text-gray-600 hover:text-purple-600 hover:bg-white/50"
              }`}
            >
              🧠 Insights
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 ${
                activeTab === "family" 
                  ? "bg-white text-rose-700 shadow-lg" 
                  : "text-gray-600 hover:text-rose-600 hover:bg-white/50"
              }`}
            >
              💕 Family
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 ${
                activeTab === "stats" 
                  ? "bg-white text-emerald-700 shadow-lg" 
                  : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
              }`}
            >
              📊 Stats
            </button>
          </div>
        </div>
      </header>

      {/* ENHANCED WELCOME BANNER */}
      <section className="max-w-7xl mx-auto px-4 py-8 mt-8">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white rounded-[2rem] shadow-2xl shadow-indigo-300/50 overflow-hidden relative animate-fadeIn">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-24 translate-x-24"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative px-6 py-12 md:px-8 md:py-14">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-5xl">👋</span>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Welcome back, {username}!</h2>
                </div>
                <p className="text-indigo-100 text-xl font-medium tracking-wide">Let's keep you healthy today</p>
              </div>
              
              <div className="flex flex-wrap gap-5">
                <div className="bg-white/10 backdrop-blur-sm px-7 py-5 rounded-2xl border-2 border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-sm font-bold text-indigo-100 mb-2 uppercase tracking-wider">Adherence Rate</div>
                  <div className="text-4xl font-black">{adherenceRate}%</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-7 py-5 rounded-2xl border-2 border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-sm font-bold text-indigo-100 mb-2 uppercase tracking-wider">Today's Reminders</div>
                  <div className="text-4xl font-black">{todayReminders}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border-2 border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-4">
                <span className="text-3xl">⏰</span>
                <div>
                  <div className="text-xs text-indigo-100 uppercase tracking-[0.15em] font-extrabold mb-1">Next Reminder</div>
                  <div className="text-xl font-bold tracking-wide">
                    {nextReminder
                      ? `${new Date(nextReminder.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} — ${nextReminder.medicineId?.medicineName}`
                      : "No upcoming reminders"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {activeTab === "home" ? (
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* DOCTOR NETWORK - ENHANCED */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-xl shadow-lg">
                    🩺
                  </span>
                  Healthcare Network
                </h2>
                <p className="text-gray-500 text-sm mt-1 ml-13">Connect with professionals and schedule appointments</p>
              </div>
            </div>
            
            {loadingDoctors ? (
              <div className="flex justify-center p-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100 border-t-indigo-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doc) => {
                  const status = getRequestStatus(doc._id);
                  return (
                    <div 
                      key={doc._id} 
                      className="group bg-white p-6 rounded-3xl shadow-md hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                          👨‍⚕️
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-lg text-gray-800 mb-1">{doc.username}</h3>
                          <p className="text-sm text-gray-500">{doc.email}</p>
                        </div>
                      </div>
                      
                      {status === "ACCEPTED" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold mb-3">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Connected
                          </div>
                          <button
                            onClick={() => { setAptDoctor(doc); setShowAptModal(true); }}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
                          >
                            <span className="text-lg">📅</span>
                            Book Appointment
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={status === "PENDING"}
                          onClick={() => handleSendRequest(doc._id)}
                          className={`w-full py-3.5 rounded-2xl font-bold transition-all duration-300 ${
                            status === "PENDING" 
                              ? "bg-yellow-50 text-yellow-700 border-2 border-yellow-200 cursor-not-allowed" 
                              : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02]"
                          }`}
                        >
                          {status === "PENDING" ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                              Connection Pending
                            </span>
                          ) : (
                            "Connect with Doctor"
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* MEDICINE MANAGEMENT - ENHANCED */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 animate-fadeIn hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <MedicineForm onSuccess={handleMedicineUpdate} medicine={selectedMedicine} />
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 animate-fadeIn hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" style={{animationDelay: '0.1s'}}>
              <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <MedicineList
                  medicines={medicines}
                  reminders={reminders}
                  onUpdate={handleMedicineUpdate}
                  onEdit={setSelectedMedicine}
                />
              </div>
            </div>
          </section>

          {/* CALENDAR SECTION - ENHANCED */}
          <section>
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 animate-fadeIn hover:shadow-2xl transition-all duration-300" style={{animationDelay: '0.2s'}}>
              <CalendarView reminders={reminders} />
            </div>
          </section>
        </main>
        
      ) : activeTab === "history" ? (
        /* MEDICATION HISTORY SECTION - ENHANCED */
        <section className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-6 border-b border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl">
                    📋
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Medication History</h2>
                    <p className="text-xs sm:text-sm text-blue-100 mt-1">Complete record of all medication activities</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownloadWeeklyReport}
                    className="group px-4 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 border border-white/30 hover:border-white/50"
                  >
                    <span className="text-base">📊</span>
                    Weekly
                  </button>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                    <div className="text-xs text-blue-100 font-semibold">Total Records</div>
                    <div className="text-xl font-black text-white">{history.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 px-6 py-4 border-b border-blue-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">✅</span>
                    <span className="text-xs font-bold text-gray-600 uppercase">Taken</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {history.filter(h => h.status === "taken").length}
                  </div>
                </div>
                <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚠️</span>
                    <span className="text-xs font-bold text-gray-600 uppercase">Missed</span>
                  </div>
                  <div className="text-2xl font-black text-red-600">
                    {history.filter(h => h.status === "missed").length}
                  </div>
                </div>
                <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💊</span>
                    <span className="text-xs font-bold text-gray-600 uppercase">Medicines</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-600">
                    {medicines.length}
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="p-6">
              {history.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                  <HistoryTable history={history} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No History Yet</h3>
                  <p className="text-gray-500 text-sm max-w-md text-center">
                    Your medication history will appear here once you start taking your medicines.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🎯</span>
                <h3 className="font-bold text-sm uppercase tracking-wide">Best Day</h3>
              </div>
              <p className="text-2xl font-black">
  {history.length > 0
    ? Object.entries(            
        history.reduce((acc, h) => {
          if (h.status === 'taken') {
            const day = new Date(h.time).toLocaleDateString('en-US', { weekday: 'long' });
            acc[day] = (acc[day] || 0) + 1;
          }
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
    : 'N/A'
  }
</p>
              <p className="text-xs text-emerald-100 mt-1">Most consistent day</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🔥</span>
                <h3 className="font-bold text-sm uppercase tracking-wide">Current Streak</h3>
              </div>
              <p className="text-2xl font-black">
                {(() => {
                  const sorted = [...history].sort((a, b) => new Date(b.time) - new Date(a.time));
                  let streak = 0;
                  for (const h of sorted) {
                    if (h.status === 'taken') streak++;
                    else break;
                  }
                  return streak;
                })()}
              </p>
              <p className="text-xs text-blue-100 mt-1">Consecutive doses taken</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">⏰</span>
                <h3 className="font-bold text-sm uppercase tracking-wide">Next Dose</h3>
              </div>
              <p className="text-lg font-black">
                {nextReminder ? (
                  <>
                    {new Date(nextReminder.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </>
                ) : (
                  'None'
                )}
              </p>
              <p className="text-xs text-purple-100 mt-1">
                {nextReminder ? nextReminder.medicineId?.medicineName : 'No upcoming reminders'}
              </p>
            </div>
          </div>
        </section>
        
      ) : activeTab === "family" ? (
        /* FAMILY CIRCLE - FROM SECOND FILE */
        <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
          {/* Pending Invites Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📬 Pending Family Invites
              </h2>
              <p className="text-amber-100 text-sm">Accept invites from family members who want you in their health circle</p>
            </div>
            <div className="p-2">
              <AlertsView />
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
        /* PREMIUM VITAL STATISTICS SECTION - FROM SECOND FILE */
        <section className="max-w-7xl mx-auto px-4 py-12 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-4xl font-black text-indigo-900 tracking-tight flex items-center gap-3">
                📊 Vital Metrics
              </h2>
              <p className="text-gray-500 font-medium ml-1 mt-1 uppercase text-[10px] tracking-[0.2em]">Comprehensive Health Analysis Profile</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadWeeklyReport}
                className="group px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[1.25rem] font-black text-sm hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-3 shadow-xl shadow-purple-200 hover:shadow-purple-300 active:scale-95"
              >
                <span className="text-lg group-hover:animate-bounce">📊</span>
                Weekly Report
              </button>
              <button
                onClick={handleDownloadReport}
                className="group px-6 py-3.5 bg-indigo-600 text-white rounded-[1.25rem] font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
              >
                <span className="text-lg group-hover:animate-bounce">📥</span>
                Full Report
              </button>
            </div>
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
                <div className="h-[350px] flex items-center justify-center">
                  <DashboardChart key={refreshTrigger + "stats"} history={history} />
                </div>
              </div>

              {/* Medicine Breakdown */}
              <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/40 ring-1 ring-black/5 flex flex-col h-[700px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">💊 Treatment Overview</h3>
                  <div className="text-[10px] font-bold text-indigo-600">
                    {paginatedTreatmentMedicines.length > 0 ? treatmentStartIndex + 1 : 0}-{Math.min(treatmentEndIndex, totalTreatmentRecords)} of {totalTreatmentRecords}
                  </div>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={treatmentOverviewSearch}
                    onChange={(e) => setTreatmentOverviewSearch(e.target.value)}
                    className="flex-1 min-w-[150px] px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                  />

                  <select
                    value={treatmentOverviewSort}
                    onChange={(e) => setTreatmentOverviewSort(e.target.value)}
                    className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:border-indigo-400 transition-colors"
                  >
                    <option value="name">Alphabetical</option>
                    <option value="adherence">Highest Adherence</option>
                  </select>

                  <select
                    value={treatmentOverviewItemsPerPage}
                    onChange={(e) => setTreatmentOverviewItemsPerPage(parseInt(e.target.value))}
                    className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:border-indigo-400 transition-colors"
                  >
                    <option value={3}>3 per page</option>
                    <option value={6}>6 per page</option>
                    <option value={12}>12 per page</option>
                  </select>
                </div>

                {/* Medicine Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-light mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {paginatedTreatmentMedicines.length > 0 ? (
                      paginatedTreatmentMedicines.map((med) => {
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
                      })
                    ) : (
                      <div className="col-span-full text-center py-12 opacity-40 italic text-sm">
                        No medicines found
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalTreatmentPages > 1 && (
                  <div className="border-t border-indigo-100 pt-4 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setTreatmentOverviewPage(p => Math.max(1, p - 1))}
                      disabled={treatmentOverviewPage === 1}
                      className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-bold text-indigo-700 transition-colors"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs font-bold text-indigo-600">
                      {treatmentOverviewPage} / {totalTreatmentPages}
                    </span>
                    <button
                      onClick={() => setTreatmentOverviewPage(p => Math.min(totalTreatmentPages, p + 1))}
                      disabled={treatmentOverviewPage === totalTreatmentPages}
                      className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-bold text-indigo-700 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Side Terminal: Activity Log */}
            <div className="space-y-8">
              <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group flex flex-col h-[700px]">
                <div className="absolute -right-10 -bottom-10 text-9xl text-white opacity-5 rotate-12 transition-transform duration-700 group-hover:rotate-0">📋</div>
                <div className="relative z-10 flex-1 flex flex-col">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                    Activity Log
                  </h3>

                  {/* Search Bar */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search medicines..."
                      value={activityLogSearch}
                      onChange={(e) => setActivityLogSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-indigo-800 border border-indigo-600 rounded-lg text-xs text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  {/* Filter & Sort Controls */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <select
                      value={activityLogFilter}
                      onChange={(e) => setActivityLogFilter(e.target.value)}
                      className="px-2 py-1 bg-indigo-800 border border-indigo-600 rounded text-[10px] font-bold text-white focus:outline-none focus:border-indigo-400 transition-colors"
                    >
                      <option value="all">All</option>
                      <option value="taken">✅ Taken</option>
                      <option value="missed">⚠️ Missed</option>
                    </select>

                    <select
                      value={activityLogSort}
                      onChange={(e) => setActivityLogSort(e.target.value)}
                      className="px-2 py-1 bg-indigo-800 border border-indigo-600 rounded text-[10px] font-bold text-white focus:outline-none focus:border-indigo-400 transition-colors"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </select>

                    <select
                      value={activityLogItemsPerPage}
                      onChange={(e) => setActivityLogItemsPerPage(parseInt(e.target.value))}
                      className="px-2 py-1 bg-indigo-800 border border-indigo-600 rounded text-[10px] font-bold text-white focus:outline-none focus:border-indigo-400 transition-colors ml-auto"
                    >
                      <option value={10}>Show 10</option>
                      <option value={15}>Show 15</option>
                      <option value={25}>Show 25</option>
                      <option value={50}>Show 50</option>
                    </select>
                  </div>

                  {/* Records Count */}
                  <div className="text-[10px] font-bold text-indigo-300 mb-2">
                    Showing {paginatedActivityLog.length > 0 ? activityLogStartIndex + 1 : 0}-{Math.min(activityLogEndIndex, totalActivityRecords)} of {totalActivityRecords} records
                  </div>

                  {/* Activity List - Scrollable */}
                  <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2 custom-scrollbar-dark scroll-smooth">
                    {paginatedActivityLog.length > 0 ? (
                      paginatedActivityLog.map((h, i) => (
                        <div
                          key={`${h._id || i}-${activityLogPage}`}
                          className="flex items-center gap-2 border-l-2 border-indigo-700/50 pl-3 py-2 hover:border-indigo-400 transition-colors bg-indigo-800/30 rounded p-2"
                        >
                          <span className="text-lg shrink-0 font-bold">{h.status === "taken" ? "✅" : "⚠️"}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black truncate text-indigo-50">
                              {h.medicineId?.medicineName || "Dose"}
                            </p>
                            <p className="text-[9px] font-bold text-indigo-300 uppercase leading-none">
                              {new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(h.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded whitespace-nowrap ${
                            h.status === "taken" ? "bg-emerald-500/30 text-emerald-200" : "bg-red-500/30 text-red-200"
                          }`}>
                            {h.status === "taken" ? "Taken" : "Missed"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 opacity-40 italic text-xs">
                        No records found
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalActivityPages > 1 && (
                    <div className="border-t border-indigo-700/50 pt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActivityLogPage(p => Math.max(1, p - 1))}
                        disabled={activityLogPage === 1}
                        className="px-2 py-1 bg-indigo-800 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-bold transition-colors"
                      >
                        ← Prev
                      </button>
                      <span className="text-xs font-bold">
                        {activityLogPage} / {totalActivityPages}
                      </span>
                      <button
                        onClick={() => setActivityLogPage(p => Math.min(totalActivityPages, p + 1))}
                        disabled={activityLogPage === totalActivityPages}
                        className="px-2 py-1 bg-indigo-800 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-bold transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  )}
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
        /* HEALTH INSIGHTS - ENHANCED */
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              🧠
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              AI Health Insights
            </h2>
          </div>
          
          {weeklyInsights.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center shadow-lg">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl">
                🤖
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Analyzing Your Health Data</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Our AI is processing your medication history. Check back in a few days for personalized weekly insights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weeklyInsights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className="group bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-black uppercase tracking-wider border border-indigo-100">
                      {insight.category}
                    </span>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${
                      insight.priority === "high" 
                        ? "bg-red-50 text-red-600 border border-red-100" 
                        : insight.priority === "medium" 
                        ? "bg-yellow-50 text-yellow-600 border border-yellow-100" 
                        : "bg-green-50 text-green-600 border border-green-100"
                    }`}>
                      {insight.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed font-medium">{insight.text}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>💡</span>
                      <span>AI-Generated Insight</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* APPOINTMENT MODAL - ENHANCED */}
      {showAptModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in duration-300 border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-2xl">
                    📅
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-800">New Appointment</h2>
                    <p className="text-sm text-gray-500">
                      with <span className="text-indigo-600 font-bold">Dr. {aptDoctor?.username}</span>
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowAptModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAptSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-semibold transition-all" 
                    onChange={(e) => setAptForm({...aptForm, date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Time</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-semibold transition-all" 
                    onChange={(e) => setAptForm({...aptForm, time: e.target.value})} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Reason for Visit</label>
                <textarea 
                  required 
                  placeholder="Describe your symptoms or concerns..."
                  className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none resize-none text-sm font-medium transition-all" 
                  rows="4"
                  onChange={(e) => setAptForm({...aptForm, problem: e.target.value})} 
                ></textarea>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAptModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02]"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENHANCED FOOTER */}
      <footer className="max-w-7xl mx-auto mt-16 px-6 py-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="font-black text-gray-700">CareSphere Digital Health</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-indigo-600 transition-colors font-medium">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors font-medium">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors font-medium">Contact Support</a>
          </div>
          
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} All rights reserved
          </div>
        </div>
      </footer>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        /* Light Theme Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Light Theme Scrollbar for Treatment Overview */
        .custom-scrollbar-light::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-track {
          background: rgba(79, 70, 229, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb {
          background: rgba(129, 140, 248, 0.5);
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: rgba(129, 140, 248, 0.8);
        }

        /* Dark Theme Scrollbar for Activity Log */
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: rgba(79, 70, 229, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(129, 140, 148, 0.6);
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: rgba(129, 140, 248, 1);
        }

        /* Smooth Scrolling */
        .scroll-smooth {
          scroll-behavior: smooth;
        }

        /* Firefox Support */
        .custom-scrollbar-dark {
          scrollbar-width: thin;
          scrollbar-color: rgba(129, 140, 248, 0.6) rgba(79, 70, 229, 0.1);
        }

        .custom-scrollbar-light {
          scrollbar-width: thin;
          scrollbar-color: rgba(129, 140, 248, 0.5) rgba(79, 70, 229, 0.05);
        }
      `}</style>
    </div>
  );
};

export default Patient;