import React, { useState } from "react";
import {
  getMedicines,
  updateMedicine,
  deleteMedicine,
} from "../api";



const MedicineList = () => {
   const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  // Fetch all medicines from backend
  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data } = await getMedicines();
      setMedicines(data?.medicines || data); // depends on backend response
    } catch (error) {
      console.error("Error fetching medicines:", error);
      alert("Failed to fetch medicines. Please check your server connection.");
    } finally {
      setLoading(false);
    }
  };

  // Mark as Taken
  const markTaken = async (id) => {
    try {
      await updateMedicine(id, { status: "Taken" });
      setMedicines((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "Taken" } : m))
      );
    } catch (error) {
      console.error("Error updating medicine status:", error);
      alert("Failed to update status.");
    }
  };

  // Mark as Missed
  const markMissed = async (id) => {
    try {
      await updateMedicine(id, { status: "Missed" });
      setMedicines((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "Missed" } : m))
      );
    } catch (error) {
      console.error("Error updating medicine status:", error);
      alert("Failed to update status.");
    }
  };

  // Delete medicine
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await deleteMedicine(id);
      setMedicines((prev) => prev.filter((m) => m._id !== id));
    } catch (error) {
      console.error("Error deleting medicine:", error);
      alert("Failed to delete medicine.");
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  if (loading) return <p className="text-center text-gray-500 mt-10">Loading medicines...</p>;


  

  const statusColors = {
    Taken: "bg-green-100 text-green-800",
    Missed: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 space-y-4">
       <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
        💊 Your Medicines
      </h2>
     

      {medicines.length === 0 ? (
        <p className="text-gray-500 text-center">No medicines added yet.</p>
      ) : (
        <div className="space-y-3">
          {medicines.map((m) => (
            <div
              key={m._id}
              className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 border border-gray-100"
            >
              {/* Medicine Info */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-lg font-semibold text-indigo-600">{m.name}</h3>
                <p className="text-gray-600">{m.dosage}</p>
               <p className="text-gray-500 text-sm">
                  {m.time} • {m.frequency}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-3 sm:mt-0">
                <span
                  className={`px-3 py-1 rounded-full font-semibold ${
                    statusColors[m.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {m.status}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-3 sm:mt-0 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => markTaken(m._id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full transition duration-200"
                >
                  Taken
                </button>
                <button
                  onClick={() => markMissed(m._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-full transition duration-200"
                >
                  Missed
                </button>
                <button
                  onClick={() => handleDelete(m._id)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded-full transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineList;