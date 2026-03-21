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
  deleteMedicine,
  getAllDoctors,
  sendDoctorRequest,
  getPatientRequests,
} from "../api";
import CaregiverList from "../components/CaregiverList";
import AlertsView from "../components/Caregiver/AlertsView";
import PatientsView from "../components/Caregiver/PatientsView";
import PatientDetailModal from "../components/Caregiver/PatientDetailModal";

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

  // Initial load
  useEffect(() => {
    fetchMedicines();
    fetchHistoryData();
    fetchReminders();
    fetchDoctors();
    fetchRequests();
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

      {/* WELCOME */}
      <section className="max-w-7xl mx-auto px-6 py-8 bg-indigo-600 text-white rounded-3xl mt-6">
        <h2 className="text-3xl font-bold">
          Welcome back, {username} 👋
        </h2>
        <p className="mt-2">
          Next Reminder:{" "}
          {nextReminder
            ? `${new Date(nextReminder.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} — ${nextReminder.medicineId?.medicineName}`
            : "No upcoming reminders"}
        </p>
      </section>

      {/* CONNECTIVITY SECTION (Doctors & Caregivers) */}
      <section className="max-w-7xl mx-auto px-6 py-6 grid lg:grid-cols-2 gap-8">

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
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {doctors.map(doc => {
                const status = getRequestStatus(doc._id);
                return (
                  <div key={doc._id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-800">{doc.username}</h3>
                        <p className="text-sm text-slate-500">{doc.email}</p>
                      </div>
                      {status === "ACCEPTED" && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Connected</span>}
                    </div>

                    <button
                      disabled={status === "PENDING" || status === "ACCEPTED"}
                      onClick={() => handleSendRequest(doc._id)}
                      className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-all text-sm ${status === "ACCEPTED"
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

      {/* DASHBOARD */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <MedicineForm
            medicine={selectedMedicine}
            onSuccess={handleMedicineUpdate}
          />
          <MedicineList
            medicines={medicines}
            reminders={reminders}
            onEdit={setSelectedMedicine}
            onUpdate={handleMedicineUpdate}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <DashboardChart key={refreshTrigger} history={history} />
          <CalendarView reminders={reminders} />
          <HistoryTable history={history} />
        </div>
      </main>
    </div>
  );
};

export default Patient;