import React, { useEffect, useState } from "react";
import { fetchHistory } from "../api";

const HistoryTable = ({ history: externalHistory }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // If history is passed as prop from parent, use it
    if (externalHistory && Array.isArray(externalHistory)) {
      setHistory(externalHistory);
      setLoading(false);
      return;
    }

    // Otherwise fetch it
    const loadHistory = async () => {
      try {
        console.log('🔍 Fetching history from HistoryTable...');
        const res = await fetchHistory();
        console.log('📦 Response:', res);
        console.log('📊 Response data:', res.data);
        
        // Handle multiple possible response structures
        let historyData = [];
        
        if (res.data.data && Array.isArray(res.data.data)) {
          historyData = res.data.data;
        } else if (res.data.history && Array.isArray(res.data.history)) {
          historyData = res.data.history;
        } else if (Array.isArray(res.data)) {
          historyData = res.data;
        } else {
          console.error('❌ Unexpected response structure:', res.data);
        }
        
        console.log('✅ History data:', historyData);
        setHistory(historyData);
      } catch (err) {
        console.error('❌ Error fetching history:', err);
        console.error('❌ Error response:', err.response?.data);
        setError("Failed to load history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [externalHistory]);

  // Filter history based on status and search term
  const filteredHistory = history.filter(h => {
    const matchesStatus = filterStatus === "all" || h.status?.toLowerCase() === filterStatus;
    const matchesSearch = !searchTerm || 
      (h.medicineName && h.medicineName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.medicineId?.medicineName && h.medicineId.medicineName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative mb-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 animate-pulse rounded-full bg-blue-600"></div>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-600">Loading history...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 py-12">
          <span className="mb-3 text-4xl">⚠️</span>
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      ) : !Array.isArray(history) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 py-12">
          <span className="mb-3 text-4xl">⚠️</span>
          <p className="font-semibold text-red-700">Invalid history data format</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 py-16">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4">
            <span className="text-4xl">📭</span>
          </div>
          <p className="font-semibold text-gray-700">No history found</p>
          <p className="mt-1 text-sm text-gray-500">Your medication records will appear here</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  filterStatus === "all"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                All ({history.length})
              </button>
              <button
                onClick={() => setFilterStatus("taken")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  filterStatus === "taken"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                ✅ Taken ({history.filter(h => h.status?.toLowerCase() === "taken").length})
              </button>
              <button
                onClick={() => setFilterStatus("missed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  filterStatus === "missed"
                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                ⚠️ Missed ({history.filter(h => h.status?.toLowerCase() === "missed").length})
              </button>
            </div>
            
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="Search medicine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 pl-10 text-sm font-medium text-gray-800 placeholder-gray-400 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-white shadow-sm">
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-extrabold uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-extrabold uppercase tracking-wider">
                      Medicine
                    </th>
                    <th className="hidden sm:table-cell px-4 py-4 text-left text-xs font-extrabold uppercase tracking-wider">
                      Dosage
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-extrabold uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <span className="mb-2 text-3xl">🔍</span>
                          <p className="font-semibold text-gray-700">No results found</p>
                          <p className="text-sm text-gray-500">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((h, index) => (
                      <tr
                        key={h._id || h.historyId || `${h.time}-${index}`}
                        className="group transition-all duration-200 hover:bg-blue-50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">
                              {new Date(h.time).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                              {new Date(h.time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💊</span>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800">
                                {h.medicineId?.medicineName || h.medicineName || 'Unknown'}
                              </span>
                              <span className="text-xs font-medium text-gray-500 sm:hidden">
                                {h.medicineId?.dosage || h.dosage || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 text-sm font-semibold text-gray-700">
                          {h.medicineId?.dosage || h.dosage || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                              h.status?.toLowerCase() === "taken"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : h.status?.toLowerCase() === "missed"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            }`}
                          >
                            {h.status?.toLowerCase() === "taken" ? "✅" : h.status?.toLowerCase() === "missed" ? "⚠️" : "⏳"}
                            <span className="hidden sm:inline">{h.status || 'Unknown'}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results count */}
          {filteredHistory.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <span className="text-xs font-bold text-gray-600">
                Showing {filteredHistory.length} of {history.length} records
              </span>
              {filterStatus !== "all" || searchTerm ? (
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setSearchTerm("");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;