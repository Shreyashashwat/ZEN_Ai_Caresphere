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

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "User";

  // -------------------- FETCHERS --------------------
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
      const sorted = (res.data.data || []).sort(
        (a, b) => new Date(a.time) - new Date(b.time)
      );
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
      data.forEach(r => r.status && (r.status = r.status.toLowerCase()));
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
    const now = new Date();
    const upcoming = reminders
      .filter(r => r.medicineId)
      .find(r => new Date(r.time) >= now && r.status === "pending");
    setNextReminder(upcoming || null);
  }, [reminders]);

  // -------------------- HANDLERS --------------------
  const handleMedicineUpdate = async () => {
    await Promise.all([
      fetchMedicines(),
      fetchHistoryData(),
      fetchReminders(),
    ]);
    setSelectedMedicine(null);
    setRefreshTrigger(prev => prev + 1);
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

  const getRequestStatus = (doctorId) => {
    const req = patientRequests.find(
      r => r.doctorId?._id === doctorId || r.doctorId === doctorId
    );
    return req?.status || null;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      {/* HEADER */}
      <header className="sticky top-0 bg-white/70 backdrop-blur shadow">
        <div className="max-w-7xl mx-auto flex justify-between px-6 py-4">
          <h1 className="text-3xl font-extrabold text-indigo-700">
            Care<span className="text-blue-500">Sphere</span>
          </h1>
          <button onClick={handleLogout} className="btn-primary">
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

      {/* DOCTOR REQUESTS */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-4">🩺 Connect with Doctors</h2>
        {loadingDoctors ? (
          <p>Loading doctors...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {doctors.map(doc => {
              const status = getRequestStatus(doc._id);
              return (
                <div key={doc._id} className="bg-white p-4 rounded-xl shadow">
                  <h3 className="font-semibold">{doc.username}</h3>
                  <p className="text-sm text-gray-600">{doc.email}</p>
                  <button
                    disabled={status === "PENDING" || status === "ACCEPTED"}
                    onClick={() => handleSendRequest(doc._id)}
                    className="mt-3 w-full btn-primary"
                  >
                    {status === "ACCEPTED"
                      ? "✓ Accepted"
                      : status === "PENDING"
                      ? "⏳ Pending"
                      : "Send Request"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
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