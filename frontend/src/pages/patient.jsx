import React from "react";
import MedicineList from "../components/MedicineList";
import MedicineForm from "../components/MedicineForm";
import HistoryTable from "../components/HistoryTable";
import CalendarView from "../components/CalendarView";
import DashboardChart from "../components/DashboardChart";

const Patient = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md shadow-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide">
            Care<span className="text-blue-500">Sphere</span> Dashboard
          </h1>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium transition duration-200 shadow">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Welcome banner */}
        <section className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-3xl p-8 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold mb-2">
              Welcome back, <span className="font-bold">Ishu 👋</span>
            </h2>
            <p className="text-white/90">
              Here’s your personalized health and medicine summary.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-center">
            <p className="text-lg font-semibold">Next Reminder:</p>
            <p className="text-2xl font-bold">8:00 PM — Paracetamol 💊</p>
          </div>
        </section>

        {/* Top Grid: Medicine Form + List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Medicine Form */}
          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              ➕ Add / Edit Medicine
            </h2>
            <MedicineForm />
          </div>

          {/* Medicine List */}
          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              💊 Medicine List
            </h2>
            <MedicineList />
          </div>
        </div>

        {/* Bottom Grid: Dashboard + Calendar + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Chart */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                📊 Progress Overview
              </h2>
              <DashboardChart />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                📅 Calendar
              </h2>
              <CalendarView />
            </div>
          </div>

          {/* Dose History */}
          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2 text-center">
              📘 Dose History
            </h2>
            <HistoryTable />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center mt-12 py-6 text-sm text-gray-500 border-t border-gray-200">
        © {new Date().getFullYear()} CareSphere — Built for better health 🩺
      </footer>
    </div>
  );
};

export default Patient;