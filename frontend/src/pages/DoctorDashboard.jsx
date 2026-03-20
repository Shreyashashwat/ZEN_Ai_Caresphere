import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPendingDoctorRequests,
  acceptDoctorRequest,
  rejectDoctorRequest,
  getDoctorDashboard,
} from "../api";

const DoctorDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Search States
  const [searchPending, setSearchPending] = useState("");
  const [searchAccepted, setSearchAccepted] = useState("");

  const navigate = useNavigate();

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await getPendingDoctorRequests();
      setPendingRequests(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getDoctorDashboard();
      setDashboardData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchDashboardData();
  }, []);

  // Filtering Logic
  const filteredPending = pendingRequests.filter((req) =>
    req.patientId?.username?.toLowerCase().includes(searchPending.toLowerCase())
  );

  const filteredAccepted = (dashboardData?.patientList || []).filter((patient) =>
    patient.patientName?.toLowerCase().includes(searchAccepted.toLowerCase())
  );

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptDoctorRequest(requestId);
      await fetchPendingRequests();
      await fetchDashboardData();
      alert("Request accepted successfully!");
    } catch (err) {
      alert("Failed to accept request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectDoctorRequest(requestId);
      await fetchPendingRequests();
      alert("Request rejected successfully!");
    } catch (err) {
      alert("Failed to reject request.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const username = JSON.parse(localStorage.getItem("user"))?.username || "Doctor";

  // ==========================================
  // VIEW 1: DETAILED PATIENT REPORT CARD
  // ==========================================
  if (selectedPatient) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedPatient(null)}
            className="mb-6 flex items-center gap-2 text-indigo-700 font-bold hover:underline"
          >
            ← Back to Dashboard
          </button>

          <div id="printable-report" className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 pb-10">
            {/* Report Header */}
            <div className="bg-indigo-700 p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">{selectedPatient.patientName}</h2>
                  <p className="opacity-80 mt-1">Patient ID: {selectedPatient.patientId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold opacity-70 uppercase">Report Date</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Profile Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Adherence Alert</p>
                    <p className="text-2xl font-black text-red-600">{selectedPatient.missedCount} Missed Doses</p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Health Status</p>
                    <p className={`text-2xl font-black ${selectedPatient.status === 'Critical' ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedPatient.status}
                    </p>
                  </div>
                  <div className="text-4xl">{selectedPatient.status === 'Critical' ? '🚨' : '✅'}</div>
                </div>
              </div>

              {/* IMAGE-STYLE MEDICINE LIST SECTION */}
              <div className="mb-10">
                <h3 className="text-3xl font-bold text-indigo-800 mb-6 flex items-center gap-3">
                  💊 Medicine List
                </h3>
                
                <div className="space-y-6">
                  {selectedPatient.todayMedicines && selectedPatient.todayMedicines.length > 0 ? (
                    selectedPatient.todayMedicines.map((med, idx) => (
                      <div key={idx} className="bg-blue-50/50 border border-blue-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                          {/* Left Side: Info */}
                          <div className="space-y-1">
                            <h4 className="text-2xl font-bold text-indigo-600 capitalize">
                              {med.medicineId?.medicineName || "N/A"}
                            </h4>
                            <div className="text-gray-600 font-medium">
                              <p>Dosage: <span className="text-gray-900 font-bold">{med.medicineId?.dosage || "N/A"}</span></p>
                              <p>Frequency: <span className="text-gray-900 font-bold">{med.medicineId?.frequency || "Daily"}</span></p>
                            </div>
                          </div>

                          {/* Right Side: Status Display (Mirroring buttons style) */}
                          <div className="flex flex-wrap gap-3">
                            {med.status === 'taken' ? (
                              <div className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold shadow-md">
                                <span>☑</span> Taken
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-md">
                                <span>✕</span> Missed
                              </div>
                            )}
                            <div className="flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold shadow-md opacity-50 cursor-not-allowed">
                                🗑 Delete
                            </div>
                          </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-full bg-white/40 skew-x-[-20deg] translate-x-16"></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 italic">No medicines currently listed for this patient.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
                >
                  PRINT FULL MEDICAL DOSAGE REPORT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 pb-20">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-indigo-100 shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-indigo-700 tracking-tighter">CareSphere.</h1>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-all">
          Logout
        </button>
      </header>

      <section className="mt-6 mx-6 p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl">
          <h2 className="text-3xl font-bold italic underline decoration-blue-400">Dr. {username}</h2>
          <p className="opacity-80 mt-1 uppercase tracking-tighter text-sm font-bold">Authorized Medical Dashboard</p>
      </section>

      {/* PENDING REQUESTS: SCROLLABLE + SEARCH */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ⏳ Pending Patient Access
            </h3>
            <input
              type="text"
              placeholder="Search by username..."
              className="w-full md:w-72 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-400 text-sm"
              value={searchPending}
              onChange={(e) => setSearchPending(e.target.value)}
            />
          </div>

          <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {loadingRequests ? (
              <p className="text-center text-gray-400 py-10">Fetching...</p>
            ) : filteredPending.length === 0 ? (
              <p className="text-center text-gray-400 py-10 italic">No pending requests found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPending.map((req) => (
                  <div key={req._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-gray-800">{req.patientId?.username}</p>
                    <p className="text-xs text-gray-400 mb-4 truncate">{req.patientId?.email}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptRequest(req._id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-[10px] font-bold">Accept</button>
                      <button onClick={() => handleRejectRequest(req._id)} className="flex-1 py-2 bg-white border border-red-100 text-red-500 rounded-lg text-[10px] font-bold">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PATIENT DIRECTORY: SEARCH + CARDS */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h3 className="text-xl font-bold text-gray-800">Your Active Patients</h3>
            <input
              type="text"
              placeholder="Quick search patient name..."
              className="w-full md:w-96 px-6 py-4 rounded-2xl bg-indigo-50 border-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium"
              value={searchAccepted}
              onChange={(e) => setSearchAccepted(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="col-span-full text-center text-gray-400 py-20">Loading Database...</p>
            ) : filteredAccepted.length === 0 ? (
              <p className="col-span-full text-center text-gray-400 py-20">No matching patients.</p>
            ) : (
              filteredAccepted.map((patient) => (
                <div
                  key={patient.patientId}
                  onClick={() => setSelectedPatient(patient)}
                  className="cursor-pointer bg-white border border-gray-50 p-6 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all transform hover:-translate-y-2 group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {patient.patientName[0]}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      patient.status === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {patient.status}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">{patient.patientName}</h4>
                  <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase">
                    <span className="text-gray-400 tracking-tighter">7-Day Missed</span>
                    <span className="text-red-500">{patient.missedCount} Doses</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DoctorDashboard;