import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardChart = () => {
 
  const [stats, setStats] = useState({ taken: 12, missed: 5 });


  useEffect(() => {
    const timer = setInterval(() => {
      setStats({
        taken: Math.floor(Math.random() * 20),
        missed: Math.floor(Math.random() * 10),
      });
    }, 5000); 
    return () => clearInterval(timer);
  }, []);

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