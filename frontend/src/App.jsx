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
import GoogleSuccess from "./pages/GoogleSuccess.jsx";

function ChatbotWrapper() {
  const location = useLocation();
  const { user, token } = useContext(UserContext);

 
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
    if (!messaging) return;

    // onMessage returns an unsubscribe function — calling it removes the listener
    const unsubscribe = onMessage(messaging, (payload) => {
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

    console.log("✅ [SETUP] Foreground notification listener registered");

    // Cleanup: removes the listener when component unmounts or re-renders (HMR)
    return () => {
      unsubscribe();
      console.log("🧹 [CLEANUP] Foreground notification listener removed");
    };
  }, []);

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
