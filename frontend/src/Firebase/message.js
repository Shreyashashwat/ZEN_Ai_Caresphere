import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase";
import { toast } from "react-toastify";
import MedicineReminderToast from "../components/MedicineReminderToast";

function Messaging() {
  useEffect(() => {
    if (!messaging) return;

    // onMessage returns an unsubscribe function
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("✅ [FOREGROUND] FCM message received:", payload);

      const { title, body, medicineId } = payload.data || {};
      if (!medicineId) return;

      toast.info(
        <MedicineReminderToast
          title={title || "💊 Medicine Reminder"}
          body={body || "Time to take your medicine!"}
          medicineId={medicineId}
        />,
        { autoClose: false, closeOnClick: false }
      );
    });

    return () => unsubscribe(); // ✅ cleanup on unmount/re-render
  }, []); // runs once

  return null;
}

export default Messaging;