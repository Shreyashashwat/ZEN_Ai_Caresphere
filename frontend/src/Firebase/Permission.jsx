import { useEffect } from "react";
import { requestPermission } from "./requestPermission";

function Permission() {
  useEffect(() => {
    requestPermission();
  }, []);

  return (
    <div>
      <h1>CareSphere Notifications 🔔</h1>
      <p>You'll see a notification when one is sent from Firebase.</p>
    </div>
  );
}

export default Permission;