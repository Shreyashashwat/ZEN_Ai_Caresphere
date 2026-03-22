
import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import axios from "axios";

export const requestPermission = async (userId) => {
  console.log("Requesting notification permission...");

  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: "BG8L7pkVGe7RpMdpDSuJd4IR-_QDh0D6Xllb9UIRgcpoeUBXhqhyRL-V2mkWLzDKMcUT24eha-BujuJm7IA4Ia0",
    });

    if (!token) {
      console.error("Failed to get FCM token from Firebase");
      return;
    }

    console.log("FCM Token:", token);

    // Send token to backend
    const response = await axios.post("http://localhost:8000/api/v1/save-token", {
      userId,
      token,
    });

    if (response.data.success) {
      console.log("✅ Token saved successfully:", response.data.data.fcmToken);
    } else {
      console.warn("❌ Failed to save token:", response.data.message);
    }
  } catch (err) {
    console.error("Error in requestPermission:", err);
  }
};
