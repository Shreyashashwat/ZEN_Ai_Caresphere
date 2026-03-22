import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctorDashboardData } from "../api"; // You'll need to add this to your api.js

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await getDoctorDashboardData();
      setData(res.data.data);
    } catch (err) {
      console.error("Error fetching doctor data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">CareSphere <span className="text-blue-500">MD</span></h1>
            <p className="text-xs text-slate-500 font-medium">Doctor Code: {JSON.parse(localStorage.getItem("user"))?.doctorCode}</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate("/"); }}
            className="text-sm font-semibold text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 1. Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Patients" value={data?.stats?.totalPatients} color="bg-indigo-600" />
          <StatCard title="Taken Today" value={data?.stats?.takenToday} color="bg-green-500" />
          <StatCard title="Missed Today" value={data?.stats?.missedToday} color="bg-red-500" />
          <StatCard title="Pending" value={data?.stats?.pendingToday} color="bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. Today's Medication Schedule (Live Feed) */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Today's Activity</h2>
            </div>
            <div className="p-0 max-h-[600px] overflow-y-auto">
              {data?.todaySchedule?.map((item) => (
                <div key={item._id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-indigo-700">{item.userId.username}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-slate-600">💊 {item.medicineId.medicineName}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Scheduled: {new Date(item.time).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Patient List & Adherence Tracking */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Patient Management</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">7-Day Adherence</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Patient Name</th>
                    <th className="px-6 py-4">Missed (Weekly)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {data?.patientList?.map((patient) => (
                    <tr key={patient.patientId} className="hover:bg-blue-50/30 transition">
                      <td className="px-6 py-4 font-medium text-slate-700">{patient.patientName}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${patient.missedCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {patient.missedCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          patient.status === 'Stable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-indigo-600 hover:underline font-semibold text-xs">View History</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// Small Helper Components
const StatCard = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
    <div className="flex items-end gap-2 mt-2">
      <h3 className="text-3xl font-black text-slate-800">{value || 0}</h3>
      <div className={`h-2 w-8 mb-2 rounded-full ${color}`}></div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    taken: "bg-green-100 text-green-700",
    missed: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700"
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${styles[status] || "bg-slate-100"}`}>
      {status}
    </span>
  );
};

export default DoctorDashboard;