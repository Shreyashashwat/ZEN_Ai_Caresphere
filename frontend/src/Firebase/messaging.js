import { useEffect } from "react";
import { requestPermission } from "./requestPermission";

function Messaging() {
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser?._id;
    requestPermission(userId);
  }, []);

  return (
    <div>
      <h1>CareSphere Notifications 🔔</h1>
      <p>You'll receive reminders when they are scheduled.</p>
    </div>
  );
}

export default Messaging;
