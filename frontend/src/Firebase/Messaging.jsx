// src/Firebase/Messaging.jsx
import { useEffect } from "react";
import { requestPermission } from "./requestPermission";

function Messaging() {
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser?._id;
    requestPermission(userId);
  }, []);

  return null; // No UI needed
}

export default Messaging;
