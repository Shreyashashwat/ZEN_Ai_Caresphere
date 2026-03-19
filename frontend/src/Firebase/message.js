import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase";
import { toast } from "react-toastify";
import axios from "axios";

function Messaging() {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);

      const { title, body } = payload.notification || {};
      const medicineId = payload.data?.medicineId;

      toast.info(
        <div style={{ padding: "10px" }}>
          <strong>{title || "💊 Medicine Reminder"}</strong>
          <p>{body || "Time to take your medicine!"}</p>
          <button
            onClick={async () => {
              try {
                await axios.patch(
                  `http://localhost:8000/api/v1/medicine/${medicineId}/snooze`,
                  { minutes: 10 }
                );
                toast.dismiss();
                toast.success("⏰ Snoozed for 10 minutes!");
              } catch (error) {
                toast.error("Failed to snooze reminder");
              }
            }}
            style={{
              background: "#007bff",
              border: "none",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Snooze 10 min
          </button>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
        }
      );
    });

    return () => unsubscribe();
  }, []);

  return null; // No UI
}

export default Messaging;
