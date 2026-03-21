import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/HomePage";
import Patient from "./pages/patient";
import Header from "./components/Header";
import ChatWidget from "./pages/Chatbot.jsx";
import About from "./pages/About";
import Contact from "./pages/Contact";

import { UserProvider, UserContext } from "./context/UserContext";
import Messaging from "./Firebase/Messaging.jsx";
import { onMessage } from "firebase/messaging";
import { messaging } from "./Firebase/firebase";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MedicineReminderToast from "./components/MedicineReminderToast";
import GoogleSuccess from "./pages/GoogleSuccess.jsx";

// Set up foreground notification listener at module level (runs once on load)
// Use window object to persist flag across hot reloads
if (!window.__FCM_LISTENER_REGISTERED__ && messaging) {
  onMessage(messaging, (payload) => {
    console.log("✅ [FOREGROUND] FCM message received:", payload);

    const { title, body, medicineId } = payload.data || {};
    if (!medicineId) {
      console.log("⚠️ No medicineId in payload, skipping notification");
      return;
    }

    toast.info(
      <MedicineReminderToast
        title={title || "💊 Medicine Reminder"}
        body={body || "Time to take your medicine!"}
        medicineId={medicineId}
      />,
      { autoClose: false, closeOnClick: false }
    );
  });
  
  window.__FCM_LISTENER_REGISTERED__ = true;
  console.log("✅ [SETUP] Foreground notification listener registered");
}

function ChatbotWrapper() {
  const location = useLocation();
  const { user, token } = useContext(UserContext);

 
  if (location.pathname !== "/patient") return null;

  
  if (!user || !token) {
    return (
      <p className="text-center text-red-500 mt-4">
        Please log in to use the chatbot.
      </p>
    );
  }

  return <ChatWidget userId={user._id} authToken={token} />;
}

function App() {
  return (
    <UserProvider>
      <Router>
        <Header />
        <Messaging /> {/* Requests notification permission */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/patient" element={<Patient />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/google-success" element={<GoogleSuccess />} />
        </Routes>
        <ChatbotWrapper />
        <ToastContainer position="top-right" />
      </Router>
    </UserProvider>
  );
}

export default App;

