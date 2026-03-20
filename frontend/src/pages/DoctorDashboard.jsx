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
  const navigate = useNavigate();

  // Fetch pending requests
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

  // Fetch dashboard data
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

  // Handle accept request
  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptDoctorRequest(requestId);
      await fetchPendingRequests();
      await fetchDashboardData(); // Refresh dashboard after accepting
      alert("Request accepted successfully!");
    } catch (err) {
      console.error("Failed to accept request:", err);
      alert(err.response?.data?.message || "Failed to accept request. Please try again.");
    }
  };

  // Handle reject request
  const handleRejectRequest = async (requestId) => {
    try {
      await rejectDoctorRequest(requestId);
      await fetchPendingRequests();
      alert("Request rejected successfully!");
    } catch (err) {
      console.error("Failed to reject request:", err);
      alert(err.response?.data?.message || "Failed to reject request. Please try again.");
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const username =
    JSON.parse(localStorage.getItem("user"))?.username || "Doctor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-indigo-100 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide flex items-center gap-2">
            <span className="text-blue-500">🩺</span> CareSphere - Doctor Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 hover:scale-105"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-none sm:rounded-3xl p-8 shadow-lg mt-6 mx-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold mb-2">
            Welcome back, <span className="font-bold">{username} 👋</span>
          </h2>
          <p className="text-white/90 text-sm sm:text-base">
            Manage patient requests and monitor accepted patients' health data.
          </p>
        </div>
      </section>

      {/* Pending Requests Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 rounded-3xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
            ⏳ Pending Patient Requests
          </h2>
          {loadingRequests ? (
            <p className="text-gray-600">Loading pending requests...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-gray-600">No pending requests at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="font-semibold text-indigo-700 text-lg">
                        {request.patientId?.username || "Unknown Patient"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {request.patientId?.email || ""}
                      </p>
                      {request.patientId?.age && (
                        <p className="text-xs text-gray-500 mt-1">
                          Age: {request.patientId.age} | Gender: {request.patientId.gender}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Accepted Patients Dashboard */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 rounded-3xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
            📊 Accepted Patients Dashboard
          </h2>
          {loading ? (
            <p className="text-gray-600">Loading dashboard data...</p>
          ) : !dashboardData ? (
            <p className="text-gray-600">No dashboard data available.</p>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-indigo-700">
                    {dashboardData.stats?.totalPatients || 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Taken Today</p>
                  <p className="text-3xl font-bold text-green-600">
                    {dashboardData.stats?.takenToday || 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Missed Today</p>
                  <p className="text-3xl font-bold text-red-600">
                    {dashboardData.stats?.missedToday || 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Pending Today</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {dashboardData.stats?.pendingToday || 0}
                  </p>
                </div>
              </div>

              {/* Today's Schedule */}
              {dashboardData.todaySchedule && dashboardData.todaySchedule.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-indigo-600 mb-4">
                    📅 Today's Schedule
                  </h3>
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full bg-white">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                              Patient
                            </th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                              Medicine
                            </th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                              Time
                            </th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.todaySchedule.map((schedule) => (
                            <tr
                              key={schedule._id}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="py-3 px-4 border-b">
                                {schedule.userId?.username || "Unknown"}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {schedule.medicineId?.medicineName || "Unknown"}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {new Date(schedule.time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="py-3 px-4 border-b">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    schedule.status === "taken"
                                      ? "bg-green-100 text-green-700"
                                      : schedule.status === "missed"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {schedule.status?.toUpperCase() || "PENDING"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient List */}
              {dashboardData.patientList && dashboardData.patientList.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-indigo-600 mb-4">
                    👥 Patient Adherence Overview
                  </h3>
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full bg-white">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                              Patient Name
                            </th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                              Missed Count (7 days)
                            </th>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.patientList.map((patient) => (
                            <tr
                              key={patient.patientId}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="py-3 px-4 border-b font-medium">
                                {patient.patientName}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {patient.missedCount}
                              </td>
                              <td className="py-3 px-4 border-b">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    patient.status === "Critical"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {patient.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {(!dashboardData.todaySchedule ||
                dashboardData.todaySchedule.length === 0) &&
                (!dashboardData.patientList ||
                  dashboardData.patientList.length === 0) && (
                  <p className="text-gray-600 text-center py-8">
                    No patient data available. Patients will appear here once they are accepted.
                  </p>
                )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center mt-12 py-6 text-sm text-gray-500 border-t border-gray-200">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-indigo-600">CareSphere</span> — Built for Better Health 🩺
      </footer>
    </div>
  );
};

export default DoctorDashboard;
