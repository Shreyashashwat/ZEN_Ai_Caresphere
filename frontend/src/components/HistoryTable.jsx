import React, { useEffect, useState } from "react";
import { fetchHistory } from "../api";

const HistoryTable = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
         const user = JSON.parse(localStorage.getItem("user"));
        const res = await fetchHistory();
        setHistory(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">
        Medicine History
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading history...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500">No history found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Medicine</th>
                <th className="py-2 px-4 border-b text-left">Dosage</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr
                  key={h._id || `${h.date}-${h.medicine}`}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="py-2 px-4 border-b">
                    {new Date(h.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b">{h.medicineName}</td>
                  <td className="py-2 px-4 border-b">{h.dosage}</td>
                  <td
                    className={`py-2 px-4 border-b font-medium ${
                      h.status === "Taken"
                        ? "text-green-600"
                        : h.status === "Missed"
                        ? "text-red-500"
                        : "text-yellow-600"
                    }`}
                  >
                    {h.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;