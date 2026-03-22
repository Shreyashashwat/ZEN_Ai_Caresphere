import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPendingDoctorRequests,
  acceptDoctorRequest,
  rejectDoctorRequest,
  getDoctorDashboard,
  getDoctorOwnAppointments, 
  updateAppointmentStatus, 
  sendAppointmentReport,
  getDoctorSentReports,
  getPatientDailyHealthNotes,
} from "../api";

const DoctorDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isScrolledPastHeader, setIsScrolledPastHeader] = useState(false);
  const [showAppointmentReport, setShowAppointmentReport] = useState(false);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState(null);
  const [sentReports, setSentReports] = useState([]);
  const [selectedPatientNotes, setSelectedPatientNotes] = useState([]);
  const [loadingSelectedPatientNotes, setLoadingSelectedPatientNotes] = useState(false);

  const [searchPending, setSearchPending] = useState("");
  const [searchAccepted, setSearchAccepted] = useState("");
  const [searchApt, setSearchApt] = useState("");
  const [searchReports, setSearchReports] = useState("");

  const navigate = useNavigate();
  const user = safeParseLocalStorage("user") || {};
  const username = user?.username || "Doctor";
  const doctorCode = user?.doctorCode || "N/A";
  const doctorInitial = String(username).charAt(0).toUpperCase() || "D";

  const navItems = [
    { label: "Dashboard", icon: DashboardIcon },
    { label: "Patients", icon: PatientsIcon },
    { label: "Appointments", icon: CalendarIcon },
    { label: "Alerts", icon: AlertsIcon },
    { label: "Reports", icon: ReportsIcon },
    { label: "Settings", icon: SettingsIcon }
  ];

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

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const res = await getDoctorOwnAppointments();
      setAppointments(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchSentReports = async () => {
    try {
      const res = await getDoctorSentReports();
      const reports = Array.isArray(res.data.data) ? res.data.data : [];
      setSentReports(
        reports.map((report) => ({
          id: report._id,
          appointmentId: report.appointmentId?._id || report.appointmentId,
          patientId: report.patientId?._id || report.patientId,
          patientEmail: report.patientId?.email || "",
          doctorName: username,
          problem: report.problem || report.appointmentId?.problem || "No issue noted",
          medicines: report.medicines || [],
          reviewNotes: report.reviewNotes || "",
          sentDate: new Date(report.reportDate).toLocaleDateString(),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch sent reports:", err);
    }
  };

  const fetchSelectedPatientNotes = async (patientId) => {
    if (!patientId) {
      setSelectedPatientNotes([]);
      return;
    }

    setLoadingSelectedPatientNotes(true);
    try {
      const res = await getPatientDailyHealthNotes(patientId);
      setSelectedPatientNotes(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch patient daily notes:", err);
      setSelectedPatientNotes([]);
    } finally {
      setLoadingSelectedPatientNotes(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchDashboardData();
    fetchAppointments();
    fetchSentReports();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPastHeader(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (selectedPatient?.patientId) {
      fetchSelectedPatientNotes(selectedPatient.patientId);
    } else {
      setSelectedPatientNotes([]);
    }
  }, [selectedPatient]);

  const filteredPending = pendingRequests.filter((req) =>
    req.patientId?.username?.toLowerCase().includes(searchPending.toLowerCase())
  );

  const filteredAccepted = (dashboardData?.patientList || []).filter((patient) =>
    patient.patientName?.toLowerCase().includes(searchAccepted.toLowerCase())
  );

  const filteredApts = appointments.filter((apt) =>
    apt.patientId?.username?.toLowerCase().includes(searchApt.toLowerCase())
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

  const handleUpdateAptStatus = async (aptId, status) => {
    try {
      await updateAppointmentStatus(aptId, status);
      await fetchAppointments();
      alert(`Appointment marked as ${status}`);
    } catch (err) {
      alert("Failed to update appointment.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const totalPatients = dashboardData?.patientList?.length || 0;
  const criticalCount = (dashboardData?.patientList || []).filter((patient) => patient.status === "Critical").length;
  const pendingCount = pendingRequests.length;
  const activeAppointments = appointments.filter((apt) => apt.status !== "COMPLETED").length;

  if (showAppointmentReport && selectedAppointmentForReport) {
    return (
      <AppointmentReportModal
        appointment={selectedAppointmentForReport}
        onClose={() => {
          setShowAppointmentReport(false);
          setSelectedAppointmentForReport(null);
        }}
        onReportSent={(reportData) => {
          setSentReports((prev) => [...prev, {
            id: Date.now(),
            ...reportData,
            sentDate: new Date().toLocaleDateString()
          }]);
        }}
        doctorName={username}
      />
    );
  }

  if (selectedPatient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setSelectedPatient(null)}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-white/40 text-indigo-700 font-semibold hover:bg-white transition-all duration-300"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div id="printable-report" className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_24px_60px_-35px_rgba(15,23,42,0.55)] overflow-hidden border border-white/40 pb-8">
            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-8 text-white">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Adherence Alert</p>
                    <p className="text-2xl font-black text-rose-600">{selectedPatient.missedCount} Missed Doses</p>
                  </div>
                  <AlertsIcon className="h-10 w-10 text-rose-500" />
                </div>
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Health Status</p>
                    <p className={`text-2xl font-black ${selectedPatient.status === "Critical" ? "text-rose-600" : "text-emerald-600"}`}>
                      {selectedPatient.status}
                    </p>
                  </div>
                  {selectedPatient.status === "Critical" ? (
                    <AlertsIcon className="h-10 w-10 text-rose-500" />
                  ) : (
                    <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
                  )}
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-3xl font-bold text-indigo-800 mb-6 flex items-center gap-3">
                  <MedicinesIcon className="h-8 w-8" />
                  Medicine List
                </h3>

                <div className="space-y-6">
                  {selectedPatient.todayMedicines && selectedPatient.todayMedicines.length > 0 ? (
                    selectedPatient.todayMedicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50/70 border border-blue-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                          <div className="space-y-1">
                            <h4 className="text-2xl font-bold text-indigo-600 capitalize">
                              {med.medicineId?.medicineName || "N/A"}
                            </h4>
                            <div className="text-gray-600 font-medium">
                              <p>Dosage: <span className="text-gray-900 font-bold">{med.medicineId?.dosage || "N/A"}</span></p>
                              <p>Frequency: <span className="text-gray-900 font-bold">{med.medicineId?.frequency || "Daily"}</span></p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {med.status === "taken" ? (
                              <div className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold shadow-md">
                                <CheckCircleIcon className="h-4 w-4" /> Taken
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold shadow-md">
                                <AlertsIcon className="h-4 w-4" /> Missed
                              </div>
                            )}
                            <div className="flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold shadow-md opacity-50 cursor-not-allowed">
                              <DeleteIcon className="h-4 w-4" /> Delete
                            </div>
                          </div>
                        </div>
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

              <div className="mb-10">
                <h3 className="text-3xl font-bold text-indigo-800 mb-6 flex items-center gap-3">
                  <NotesIcon className="h-8 w-8" />
                  Daily Health Notes
                </h3>

                {loadingSelectedPatientNotes ? (
                  <CardListSkeleton />
                ) : selectedPatientNotes.length === 0 ? (
                  <div className="text-center p-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 italic">No daily notes shared by this patient yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPatientNotes.slice(0, 20).map((note) => (
                      <div
                        key={note._id}
                        className="bg-indigo-50/70 border border-indigo-100 rounded-[1.5rem] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-500 mb-2">
                          {new Date(note.noteDate || note.createdAt).toLocaleString()}
                        </p>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-8">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
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

  const isInitialLoading = loading && loadingRequests && loadingAppointments;
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  const renderMainContent = () => {
    switch (activeNav) {
      case "Dashboard":
        return (
          <div className="space-y-6 sm:space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              <StatCard
                title="Total Patients"
                value={totalPatients}
                icon={<PatientsIcon className="h-5 w-5" />}
                accent="from-indigo-500 to-blue-500"
              />
              <StatCard
                title="Pending Requests"
                value={pendingCount}
                icon={<ClockIcon className="h-5 w-5" />}
                accent="from-amber-500 to-yellow-500"
              />
              <StatCard
                title="Active Appointments"
                value={activeAppointments}
                icon={<CalendarIcon className="h-5 w-5" />}
                accent="from-emerald-500 to-teal-500"
              />
              <StatCard
                title="Critical Alerts"
                value={criticalCount}
                icon={<AlertsIcon className="h-5 w-5" />}
                accent="from-rose-500 to-orange-500"
              />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DashboardCard title="Recent Activity" isLoading={loadingRequests} isEmpty={pendingRequests.length === 0}>
                <div className="space-y-3">
                  {pendingRequests.slice(0, 5).map((req) => (
                    <div key={req._id} className="p-4 rounded-2xl bg-white/75 border border-slate-100">
                      <p className="font-semibold text-slate-800">{req.patientId?.username || "Unknown"}</p>
                      <p className="text-xs text-slate-500">Pending access request</p>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Upcoming Appointments" isLoading={loadingAppointments} isEmpty={appointments.length === 0}>
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((apt) => (
                    <div key={apt._id} className="p-4 rounded-2xl bg-white/75 border border-slate-100">
                      <p className="font-semibold text-slate-800">{apt.patientId?.username}</p>
                      <p className="text-xs text-slate-500">{new Date(apt.appointmentDate).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>
        );

      case "Patients":
        return (
          <div className="space-y-6">
            <section className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.5)] overflow-hidden transition-all duration-300 hover:shadow-[0_16px_50px_-22px_rgba(37,99,235,0.45)]">
              <div className="p-5 border-b border-slate-100/80 bg-white/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <PatientsIcon className="h-5 w-5 text-indigo-600" />
                  Your Active Patients
                </h3>
                <input
                  type="text"
                  placeholder="Search patient name"
                  className="w-full md:w-80 px-4 py-2.5 rounded-xl bg-white/80 border border-slate-200 focus:ring-2 focus:ring-indigo-400 text-sm"
                  value={searchAccepted}
                  onChange={(e) => setSearchAccepted(e.target.value)}
                />
              </div>

              <div className="p-5 overflow-x-auto">
                {loading ? (
                  <TableSkeleton rows={6} />
                ) : filteredAccepted.length === 0 ? (
                  <EmptyState
                    icon={<PatientsIcon className="h-6 w-6" />}
                    title="No active patients"
                    description="Patients linked to your doctor profile will appear in this list."
                  />
                ) : (
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/80">
                      <tr>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">7-Day Missed</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 text-sm">
                      {filteredAccepted.map((patient) => (
                        <tr key={patient.patientId} className="hover:bg-blue-50/45 transition-all duration-300">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                                {String(patient.patientName || "P").charAt(0).toUpperCase()}
                              </div>
                              <p className="font-semibold text-slate-800">{patient.patientName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={patient.missedCount > 0 ? "font-bold text-rose-600" : "font-bold text-slate-400"}>
                              {patient.missedCount} doses
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                                patient.status === "Critical"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors duration-300"
                            >
                              View Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.5)] overflow-hidden">
              <div className="p-5 border-b border-slate-100/80 bg-white/30 flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-indigo-600" />
                  Pending Patient Access Requests
                </h3>
                <input
                  type="text"
                  placeholder="Search username"
                  className="w-44 sm:w-52 px-3 py-2 rounded-lg bg-white/80 border border-slate-200 focus:ring-2 focus:ring-indigo-400 text-sm"
                  value={searchPending}
                  onChange={(e) => setSearchPending(e.target.value)}
                />
              </div>

              <div className="p-5 max-h-[430px] overflow-y-auto">
                {loadingRequests ? (
                  <CardListSkeleton />
                ) : filteredPending.length === 0 ? (
                  <EmptyState
                    icon={<ClockIcon className="h-6 w-6" />}
                    title="No pending requests"
                    description="New access requests from patients will appear in this panel."
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredPending.map((req) => (
                      <div key={req._id} className="p-4 rounded-2xl bg-white/75 border border-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                        <p className="font-semibold text-slate-800">{req.patientId?.username || "Unknown"}</p>
                        <p className="text-xs text-slate-500 mb-3 truncate">{req.patientId?.email || "No email"}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors duration-300"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req._id)}
                            className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors duration-300"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        );

      case "Appointments": {
        const pendingApts = filteredApts.filter((apt) => apt.status === "PENDING");
        const acceptedApts = filteredApts.filter((apt) => apt.status === "ACCEPTED");
        const todayStr = new Date().toDateString();
        const todaysApts = filteredApts.filter(
          (apt) => new Date(apt.appointmentDate).toDateString() === todayStr
        );
        const prioritizedApts = [...filteredApts].sort((a, b) => {
          const aPending = a.status === "PENDING" ? 0 : 1;
          const bPending = b.status === "PENDING" ? 0 : 1;
          if (aPending !== bPending) return aPending - bPending;
          return new Date(a.appointmentDate) - new Date(b.appointmentDate);
        });

        return (
          <section className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.5)] overflow-hidden transition-all duration-300 hover:shadow-[0_16px_50px_-22px_rgba(37,99,235,0.45)]">
            <div className="p-5 border-b border-slate-100/80 bg-white/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" />
                  Appointment Schedules
                </h3>
                <p className="text-xs text-slate-500 mt-1">New requests are highlighted and pinned at the top.</p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">New Requests</p>
                  <p className="text-sm font-black text-amber-800">{pendingApts.length}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Today</p>
                  <p className="text-sm font-black text-indigo-800">{todaysApts.length}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Accepted</p>
                  <p className="text-sm font-black text-emerald-800">{acceptedApts.length}</p>
                </div>
                <input
                  type="text"
                  placeholder="Search appointments"
                  className="w-44 sm:w-52 px-3 py-2 rounded-lg bg-white/80 border border-slate-200 focus:ring-2 focus:ring-indigo-400 text-sm"
                  value={searchApt}
                  onChange={(e) => setSearchApt(e.target.value)}
                />
              </div>
            </div>

            <div className="p-5 overflow-x-auto">
              {loadingAppointments ? (
                <TableSkeleton rows={5} />
              ) : prioritizedApts.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="h-6 w-6" />}
                  title="No appointments scheduled"
                  description="Scheduled consultations will appear here when available."
                />
              ) : (
                <table className="w-full min-w-[640px] text-left">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-sm">
                    {prioritizedApts.map((apt) => {
                      const statusStyles = {
                        PENDING: "bg-amber-50 text-amber-700 border-amber-200",
                        ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
                        REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
                      };
                      const isPending = apt.status === "PENDING";
                      const hasSentReport = sentReports.some(
                        (report) => String(report.appointmentId) === String(apt._id)
                      );

                      return (
                        <tr
                          key={apt._id}
                          className={`transition-all duration-300 ${
                            isPending
                              ? "bg-amber-50/55 hover:bg-amber-100/65"
                              : "hover:bg-blue-50/45"
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800">{apt.patientId?.username || "Unknown"}</p>
                              {isPending && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wide">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{apt.problem || "No issue note"}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{new Date(apt.appointmentDate).toLocaleString()}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide ${
                                statusStyles[apt.status] || "bg-white text-slate-700 border-slate-200"
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {apt.status === "PENDING" && (
                                <button
                                  onClick={() => handleUpdateAptStatus(apt._id, "ACCEPTED")}
                                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors duration-300"
                                >
                                  Approve
                                </button>
                              )}
                              {apt.status === "ACCEPTED" && (
                                <button
                                  onClick={() => handleUpdateAptStatus(apt._id, "COMPLETED")}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors duration-300"
                                >
                                  Mark Done
                                </button>
                              )}
                              {apt.status === "COMPLETED" && !hasSentReport && (
                                <button
                                  onClick={() => {
                                    setSelectedAppointmentForReport(apt);
                                    setShowAppointmentReport(true);
                                  }}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors duration-300"
                                >
                                  Generate Report
                                </button>
                              )}
                              {apt.status === "COMPLETED" && hasSentReport && (
                                <span className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold">
                                  Report Sent
                                </span>
                              )}
                              {(apt.status === "PENDING" || apt.status === "ACCEPTED") && (
                                <button
                                  onClick={() => handleUpdateAptStatus(apt._id, "REJECTED")}
                                  className="px-3 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors duration-300"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        );
      }

      case "Alerts":
        return (
          <div className="space-y-6">
            <section className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.5)] overflow-hidden">
              <div className="p-5 border-b border-slate-100/80 bg-white/30">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <AlertsIcon className="h-5 w-5 text-rose-600" />
                  Critical Alerts
                </h3>
              </div>
              <div className="p-5">
                {loading ? (
                  <TableSkeleton rows={4} />
                ) : (
                  <div className="space-y-3">
                    {(dashboardData?.patientList || [])
                      .filter((p) => p.status === "Critical")
                      .map((patient) => (
                        <div key={patient.patientId} className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-rose-900">{patient.patientName}</p>
                              <p className="text-sm text-rose-700">{patient.missedCount} missed doses</p>
                            </div>
                            <AlertsIcon className="h-6 w-6 text-rose-600" />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        );

      case "Reports":
        const filteredReports = sentReports.filter((report) =>
          report.patientEmail?.toLowerCase().includes(searchReports.toLowerCase()) ||
          report.patientId?.toString().toLowerCase().includes(searchReports.toLowerCase())
        );

        return (
          <section className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.5)] overflow-hidden">
            <div className="p-5 border-b border-slate-100/80 bg-white/30 flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ReportsIcon className="h-5 w-5 text-indigo-600" />
                Sent Reports
              </h3>
              <input
                type="text"
                placeholder="Search by patient email"
                className="w-44 sm:w-52 px-3 py-2 rounded-lg bg-white/80 border border-slate-200 focus:ring-2 focus:ring-indigo-400 text-sm"
                value={searchReports}
                onChange={(e) => setSearchReports(e.target.value)}
              />
            </div>

            <div className="p-5">
              {filteredReports.length === 0 ? (
                <EmptyState
                  icon={<ReportsIcon className="h-6 w-6" />}
                  title="No reports sent yet"
                  description="Reports you send to patients will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-indigo-900">{report.patientEmail}</h4>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-indigo-600 font-bold uppercase">Chief Complaint</p>
                              <p className="text-slate-700 font-medium">{report.problem || "No issue noted"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-indigo-600 font-bold uppercase">Medicines</p>
                              <p className="text-slate-700 font-medium">{report.medicines?.length || 0} prescribed</p>
                            </div>
                            <div>
                              <p className="text-xs text-indigo-600 font-bold uppercase">Sent Date</p>
                              <p className="text-slate-700 font-medium">{report.sentDate}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[180px]">
                          <button
                            onClick={() => {
                              const content = `
APPOINTMENT REPORT
=================

Patient Email: ${report.patientEmail}
Doctor: Dr. ${report.doctorName}
Problem: ${report.problem || "No issue noted"}
Report Date: ${report.sentDate}

PRESCRIBED MEDICINES:
${report.medicines?.length > 0 ? report.medicines.map(med => `- ${med.medicineName}: ${med.dosage}, ${med.frequency}`).join("\n") : "No medicines prescribed"}

DOCTOR'S REVIEW:
${report.reviewNotes || "No additional notes"}
                              `;
                              const element = document.createElement("a");
                              element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
                              element.setAttribute("download", `report_${report.patientEmail}_${report.sentDate.replace(/\//g, '-')}.txt`);
                              element.style.display = "none";
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all duration-300"
                          >
                            ⬇️ Download
                          </button>
                          <button
                            onClick={() => alert("Resend functionality coming soon!")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all duration-300"
                          >
                            🔄 Resend
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );

      case "Settings":
        return (
          <div className="text-center py-20">
            <SettingsIcon className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Settings Coming Soon</h3>
            <p className="text-slate-500">Configure your preferences here.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-slate-800">
      <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.22),_transparent_45%),radial-gradient(circle_at_10%_90%,_rgba(99,102,241,0.15),_transparent_42%)]" />

      <aside
        className={`hidden md:flex fixed left-4 w-64 z-40 transition-all duration-300 ${
          isScrolledPastHeader ? "top-4 bottom-4" : "top-20 h-[calc(100vh-5rem)]"
        }`}
      >
        <div className="w-full rounded-3xl bg-white/55 backdrop-blur-xl border border-white/40 shadow-[0_18px_55px_-25px_rgba(15,23,42,0.45)] p-5 flex flex-col">
          <div className="mb-12">
            <h1 className="text-2xl font-black tracking-tight text-indigo-900">CareSphere</h1>
            <p className="text-xs text-slate-500 mt-1">Doctor Code: {doctorCode}</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === activeNav;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveNav(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex items-center justify-center gap-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all duration-300"
          >
            <LogoutIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="relative z-10 md:ml-72 pb-10">
        <header className="sticky top-0 z-30 px-4 sm:px-6 pt-4">
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_12px_35px_-20px_rgba(15,23,42,0.55)] px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-bold text-indigo-600">Hospital Dashboard</p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{activeNav}</h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all duration-300 flex items-center justify-center"
                >
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
                </button>

                <div className="flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-2 border border-white/50">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold flex items-center justify-center">
                    {doctorInitial}
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <p className="text-sm font-semibold text-slate-800">Dr. {username}</p>
                    <p className="text-xs text-slate-500">Attending Physician</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:hidden mt-4 -mx-1 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 px-1 pb-1 min-w-max">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.label === activeNav;
                  return (
                    <button
                      key={`mobile-${item.label}`}
                      type="button"
                      onClick={() => setActiveNav(item.label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        isActive ? "bg-indigo-600 text-white" : "bg-white/75 text-slate-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6 sm:py-8">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, accent }) => (
  <div className="group rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 p-5 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-26px_rgba(37,99,235,0.55)]">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.16em]">{title}</p>
      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${accent} text-white flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="flex items-end justify-between mt-4">
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      <div className={`h-2.5 w-10 rounded-full bg-gradient-to-r ${accent} opacity-80 group-hover:w-14 transition-all duration-300`} />
    </div>
  </div>
);

const DashboardCard = ({ title, children, isLoading, isEmpty }) => (
  <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.5)] overflow-hidden transition-all duration-300 hover:shadow-[0_16px_50px_-22px_rgba(37,99,235,0.45)]">
    <div className="p-5 border-b border-slate-100/80 bg-white/30">
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
    <div className="p-5">
      {isLoading ? <CardListSkeleton /> : isEmpty ? <EmptyState icon={<ClockIcon className="h-6 w-6" />} title="No data" description="No items to display." /> : children}
    </div>
  </div>
);

const EmptyState = ({ icon, title, description }) => (
  <div className="py-12 px-6 text-center">
    <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
      {icon}
    </div>
    <h4 className="mt-4 text-base font-bold text-slate-800">{title}</h4>
    <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
  </div>
);

const CardListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((item) => (
      <div key={item} className="rounded-2xl p-4 bg-slate-100/70 border border-slate-100">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-3 w-52 bg-slate-200 rounded mt-2" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="h-8 bg-slate-200 rounded" />
          <div className="h-8 bg-slate-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const TableSkeleton = ({ rows = 4 }) => (
  <div className="space-y-2 animate-pulse">
    <div className="h-10 bg-slate-100 rounded" />
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-14 bg-slate-100 rounded" />
    ))}
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 animate-pulse">
    <div className="hidden md:block fixed left-4 top-4 bottom-4 w-64 rounded-3xl bg-white/50 border border-white/40" />
    <div className="md:ml-72 p-4 sm:p-6 space-y-6">
      <div className="h-24 rounded-2xl bg-white/60 border border-white/40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-36 rounded-2xl bg-white/60 border border-white/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-[420px] rounded-3xl bg-white/60 border border-white/40" />
        <div className="h-[420px] rounded-3xl bg-white/60 border border-white/40" />
      </div>
      <div className="h-[420px] rounded-3xl bg-white/60 border border-white/40" />
    </div>
  </div>
);

const safeParseLocalStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const IconBase = ({ className = "h-4 w-4", children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    {children}
  </svg>
);

const DashboardIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="13" y="10" width="8" height="11" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
  </IconBase>
);

const PatientsIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M16 19a4 4 0 0 0-8 0" />
    <circle cx="12" cy="9" r="3" />
    <path d="M5 19a3 3 0 0 1 3-3" />
    <path d="M19 19a3 3 0 0 0-3-3" />
  </IconBase>
);

const MedicinesIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="5" y="4" width="14" height="16" rx="3" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </IconBase>
);

const AlertsIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M12 3 3 19h18L12 3Z" />
    <path d="M12 9v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </IconBase>
);

const ReportsIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M4 20h16" />
    <rect x="6" y="11" width="3" height="6" rx="0.8" />
    <rect x="11" y="7" width="3" height="10" rx="0.8" />
    <rect x="16" y="4" width="3" height="13" rx="0.8" />
  </IconBase>
);

const SettingsIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.8 1.8 0 0 1 0 2.6 1.8 1.8 0 0 1-2.6 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.8 1.8 0 0 1-3.6 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.8 1.8 0 0 1-2.6 0 1.8 1.8 0 0 1 0-2.6l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.8 1.8 0 0 1 0-3.6h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.8 1.8 0 0 1 0-2.6 1.8 1.8 0 0 1 2.6 0l.1.1a1 1 0 0 0 1.1.2H8a1 1 0 0 0 .6-.9V4a1.8 1.8 0 0 1 3.6 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.8 1.8 0 0 1 2.6 0 1.8 1.8 0 0 1 0 2.6l-.1.1a1 1 0 0 0-.2 1.1V8a1 1 0 0 0 .9.6H20a1.8 1.8 0 0 1 0 3.6h-.1a1 1 0 0 0-.9.6Z" />
  </IconBase>
);

const BellIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M15 18H9" />
    <path d="M6.5 16.5c1.4-1.5 1.5-3 1.5-6a4 4 0 1 1 8 0c0 3 .1 4.5 1.5 6" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </IconBase>
);

const LogoutIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M10 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
    <path d="M14 8l4 4-4 4" />
    <path d="M18 12H8" />
  </IconBase>
);

const CheckCircleIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.2 2.2 4.8-4.8" />
  </IconBase>
);

const ClockIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </IconBase>
);

const CalendarIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M3 10h18" />
  </IconBase>
);

const ArrowLeftIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </IconBase>
);

const DeleteIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
  </IconBase>
);

const NotesIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M6 4h9l3 3v13H6z" />
    <path d="M15 4v3h3" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </IconBase>
);

const AppointmentReportModal = ({ appointment, onClose, onReportSent, doctorName }) => {
  const [reportNotes, setReportNotes] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [prescribedMedicines, setPrescribedMedicines] = useState([]);
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Daily");

  const handleAddMedicine = () => {
    if (!medicineName.trim() || !dosage.trim()) {
      alert("Please enter medicine name and dosage");
      return;
    }

    const newMedicine = {
      id: Date.now(),
      medicineName: medicineName.trim(),
      dosage: dosage.trim(),
      frequency: frequency
    };

    setPrescribedMedicines([...prescribedMedicines, newMedicine]);
    setMedicineName("");
    setDosage("");
    setFrequency("Daily");
  };

  const handleRemoveMedicine = (id) => {
    setPrescribedMedicines(prescribedMedicines.filter(med => med.id !== id));
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    const reportContent = `
APPOINTMENT REPORT
=================

Patient Name: ${appointment.patientId?.username}
Patient Email: ${appointment.patientId?.email}
Appointment Date: ${new Date(appointment.appointmentDate).toLocaleString()}
Doctor: Dr. ${doctorName}
Problem: ${appointment.problem || "No issue noted"}

PRESCRIBED MEDICINES:
${prescribedMedicines.length > 0 ? prescribedMedicines.map(med => `- ${med.medicineName}: ${med.dosage}, ${med.frequency}`).join("\n") : "No medicines prescribed"}

DOCTOR'S REVIEW:
${reportNotes || "No additional notes"}
    `;
    
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(reportContent));
    element.setAttribute("download", `appointment_report_${appointment._id}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendReport = async () => {
    if (!reportNotes.trim()) {
      alert("Please add doctor's review notes before sending the report.");
      return;
    }

    if (prescribedMedicines.length === 0) {
      alert("Please prescribe at least one medicine before sending the report.");
      return;
    }

    setIsSending(true);
    try {
      // Prepare report data
      const reportData = {
        appointmentId: appointment._id,
        patientId: appointment.patientId?._id,
        patientEmail: appointment.patientId?.email,
        doctorName: doctorName,
        problem: appointment.problem || "No issue noted",
        medicines: prescribedMedicines,
        reviewNotes: reportNotes,
        reportDate: new Date().toLocaleDateString(),
        appointmentDate: new Date(appointment.appointmentDate).toLocaleString()
      };

      await sendAppointmentReport(reportData);
      
      // Add report to the list
      if (onReportSent) {
        onReportSent(reportData);
      }
      
      alert(`Report successfully sent to patient (${appointment.patientId?.email})!`);
      onClose();
    } catch (err) {
      console.error("Failed to send report:", err);
      alert("Failed to send report. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onClose}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-white/40 text-indigo-700 font-semibold hover:bg-white transition-all duration-300"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Appointments
        </button>

        <div id="appointment-report" className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_24px_60px_-35px_rgba(15,23,42,0.55)] overflow-hidden border border-white/40 pb-8">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Appointment Report</h2>
                <p className="opacity-80 mt-1">Patient: {appointment.patientId?.username}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold opacity-70 uppercase">Report Date</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Patient Information</p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm"><span className="font-bold text-blue-900">Name:</span> {appointment.patientId?.username}</p>
                  <p className="text-sm"><span className="font-bold text-blue-900">Email:</span> {appointment.patientId?.email}</p>
                  <p className="text-sm"><span className="font-bold text-blue-900">Appointment Date:</span> {new Date(appointment.appointmentDate).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Doctor Information</p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm"><span className="font-bold text-indigo-900">Doctor:</span> Dr. {doctorName}</p>
                  <p className="text-sm"><span className="font-bold text-indigo-900">Chief Complaint:</span> {appointment.problem || "No issue noted"}</p>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-2xl font-bold text-indigo-800 mb-6 flex items-center gap-3">
                <MedicinesIcon className="h-6 w-6" />
                Prescribe Medicines
              </h3>

              <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-6 mb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Medicine Name *</label>
                      <input
                        type="text"
                        value={medicineName}
                        onChange={(e) => setMedicineName(e.target.value)}
                        placeholder="e.g., Aspirin, Paracetamol"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Dosage *</label>
                      <input
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g., 500mg, 1 tablet"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
                      >
                        <option>Daily</option>
                        <option>Twice Daily</option>
                        <option>Thrice Daily</option>
                        <option>Every 4 Hours</option>
                        <option>Every 6 Hours</option>
                        <option>Every 8 Hours</option>
                        <option>As Needed</option>
                        <option>Once Weekly</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddMedicine}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300"
                      >
                        + Add Medicine
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {prescribedMedicines.length > 0 ? (
                  prescribedMedicines.map((med) => (
                    <div
                      key={med.id}
                      className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-lg font-bold text-emerald-700">{med.medicineName}</h4>
                        <div className="text-gray-600 font-medium mt-2 space-y-1">
                          <p className="text-sm">Dosage: <span className="text-gray-900 font-bold">{med.dosage}</span></p>
                          <p className="text-sm">Frequency: <span className="text-gray-900 font-bold">{med.frequency}</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMedicine(med.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg transition-all duration-300 min-w-fit"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 italic">No medicines prescribed yet. Add medicines above.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-2xl font-bold text-indigo-800 mb-4">Doctor's Review & Notes</h3>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Enter your clinical observations, examination findings, diagnosis and recommendations for the patient..."
                className="w-full px-5 py-4 rounded-2xl bg-white/70 border-2 border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-medium text-slate-800 resize-none h-40"
              />
            </div>

            <div className="border-t border-gray-100 pt-8 space-y-3">
              <button
                onClick={handlePrintReport}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-base"
              >
                🖨️ PRINT REPORT
              </button>
              <button
                onClick={handleDownloadReport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-base"
              >
                ⬇️ DOWNLOAD REPORT
              </button>
              <button
                onClick={handleSendReport}
                disabled={isSending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-base"
              >
                {isSending ? "📤 SENDING..." : "📧 SEND REPORT TO PATIENT"}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-black py-4 rounded-2xl shadow-lg transition-all duration-300 text-base"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;