import React, { useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/HomePage";
import Patient from "./pages/patient";
import DoctorDashboard from "./pages/DoctorDashboard";
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

function ChatbotWrapper() {
  const location = useLocation();
  const { user, token } = useContext(UserContext);

  useEffect(() => {
    if (location.pathname !== "/patient") return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground FCM message received:", payload);

      // Use data payload from backend (data-only message)
      const { title, body, medicineId } = payload.data || {};

      if (!medicineId) return; // skip invalid messages

      toast.info(
        <MedicineReminderToast title={title || "💊 Medicine Reminder"} body={body || ""} medicineId={medicineId} />,
        { autoClose: false, closeOnClick: false }
      );
    });

    return () => unsubscribe();
  }, [location.pathname]);

  if (location.pathname !== "/patient") return null;

  if (!user || !token) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <p className="text-xs text-red-500 bg-white border border-red-200 px-3 py-2 rounded-lg shadow-lg">
          Log in to chat with AI Assistant 🤖
        </p>
      </div>
    );
  }

  return <ChatWidget userId={user._id} authToken={token} />;
}

function App() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => console.log("Service Worker registered:", reg))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return (
    <UserProvider>
      <Router>
        <Header />
        <Messaging /> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/patient" element={<Patient />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
        </Routes>
        <ChatbotWrapper /> 
        <ToastContainer position="top-right" />
      </Router>
    </UserProvider>
  );
}

export default App;