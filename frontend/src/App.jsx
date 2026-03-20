import React, { useContext, useEffect } from "react";
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

function HeaderWrapper() {
  const location = useLocation();
  // Hide global header on specific paths
  if (location.pathname === "/caregiver-dashboard") return null;
  return <Header />;
}

function ChatbotWrapper() {
  const location = useLocation();
  const { user, token } = useContext(UserContext);

  useEffect(() => {
    if (location.pathname !== "/patient") return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      if (Notification.permission === "granted" && payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
        });
      }
    });

    return () => unsubscribe();
  }, [location.pathname]);

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
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => console.log("SW registered:", reg))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return (
    <UserProvider>
      <Router>
        <HeaderWrapper />
        <Messaging /> {/* Requests notification permission */}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/patient" element={<Patient />} />
        </Routes>
        <ChatbotWrapper /> {/* Foreground notifications */}
      </Router>
    </UserProvider>
  );
}

export default App;