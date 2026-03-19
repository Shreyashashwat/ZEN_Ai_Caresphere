
import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import axios from "axios";

export const requestPermission = async (userId) => {
  console.log("Requesting notification permission...");

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BJ2KvLbvU3ihA_WFNrclOR8Cg-rlBWJNweT8VPEPkmch0B_pGheoKvVjiv_Z3n42qwAqoqW7s9rm90nITyjkvCY",
    });

    console.log("FCM Token:", token);

    await axios.post("http://localhost:8000/api/v1/save-token", {
      userId,
      token,
    });
  } else {
    console.warn("Notification permission denied");
  }
};