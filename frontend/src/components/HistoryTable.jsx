import React, { useEffect, useState } from "react";
import { fetchHistory } from "../api";

function HistoryTable() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchHistory().then((res) => setHistory(res.data));
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">History</h2>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">Date</th>
                        <th className="py-2 px-4 border-b text-left">Medicine</th>
                        <th className="py-2 px-4 border-b text-left">Dosage</th>
                    </tr>
                </thead>
                <tbody>
                    {history && history.length > 0 ? (
                        history.map((h) => (
                            <tr key={h.id || `${h.date}-${h.medicine}`} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{h.date}</td>
                                <td className="py-2 px-4 border-b">{h.medicine}</td>
                                <td className="py-2 px-4 border-b">{h.dosage}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="py-4 px-4 text-center text-gray-500">
                                No history found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default HistoryTable;