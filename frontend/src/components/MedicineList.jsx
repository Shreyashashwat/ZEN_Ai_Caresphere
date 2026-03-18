import React from "react";

function MedicineList() {
  // Internal example data
  const medicines = [
    { id: 1, name: "Paracetamol", dosage: "500mg", time: "Morning" },
    { id: 2, name: "Amoxicillin", dosage: "250mg", time: "Afternoon" },
    { id: 3, name: "Vitamin D", dosage: "1000 IU", time: "Night" },
  ];

  // Example handler functions (for demo only)
  const handleEdit = (med) => {
    alert(`Edit clicked for ${med.name}`);
  };

  const handleRemove = (id) => {
    alert(`Remove clicked for medicine ID: ${id}`);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Medicine List</h2>
      <ul className="space-y-3">
        {medicines.map((med) => (
          <li
            key={med.id}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition"
          >
            <div>
              <p className="font-medium text-gray-800">{med.name}</p>
              <p className="text-sm text-gray-500">
                {med.dosage} • {med.time}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(med)}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleRemove(med.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MedicineList;