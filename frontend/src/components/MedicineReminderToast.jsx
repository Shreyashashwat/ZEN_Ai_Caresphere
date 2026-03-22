import React from "react";
import axios from "axios";
import { toast } from "react-toastify";

const MedicineReminderToast = ({ title, body, medicineId }) => {
  const snoozeMinutes = 10;

  const handleSnooze = async () => {
    try {
      await axios.patch(
        `http://localhost:8000/api/v1/medicine/${medicineId}/snooze`,
        { minutes: snoozeMinutes }
      );
      toast.dismiss(); // close current toast
      toast.success(`Snoozed for ${snoozeMinutes} minutes`);
    } catch (err) {
      toast.error("Error snoozing reminder");
    }
  };

  return (
    <div style={{ padding: "10px", color: "#333" }}>
      <strong>{title}</strong>
      <p style={{ margin: "6px 0" }}>{body}</p>
      <button
        onClick={handleSnooze}
        style={{
          background: "#007bff",
          border: "none",
          color: "#fff",
          padding: "5px 10px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Snooze 10 min
      </button>
    </div>
  );
};

export default MedicineReminderToast;
