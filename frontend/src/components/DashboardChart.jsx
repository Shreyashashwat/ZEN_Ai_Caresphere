import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { getDashboardStats } from "../api";

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardChart = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({ taken: 0, missed: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await getDashboardStats();
      setStats({
        taken: data.data.taken || 0,
        missed: data.data.missed || 0,
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const data = {
    labels: ["Taken", "Missed"],
    datasets: [
      {
        label: "Medicine Status",
        data: [stats.taken, stats.missed],
        backgroundColor: ["#4ade80", "#f87171"],
        borderColor: ["#22c55e", "#ef4444"],
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <p className="text-center text-gray-500">Loading chart...</p>;

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-3xl shadow-lg">
      <h2 className="text-xl font-semibold text-center text-indigo-600 mb-4">
        Medicine Status Overview
      </h2>
      <Doughnut data={data} />
      <div className="flex justify-around mt-4 text-gray-700 font-medium">
        <span>✅ Taken: {stats.taken}</span>
        <span>❌ Missed: {stats.missed}</span>
      </div>
    </div>
  );
};

export default DashboardChart;