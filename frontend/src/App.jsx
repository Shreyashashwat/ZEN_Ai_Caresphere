import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/HomePage";
import Patient from "./pages/patient";
import Header from "./components/Header";
import ChatWidget from "./pages/Chatbot";

import { UserProvider, UserContext } from "./context/UserContext";

// ChatbotWrapper defined here
function ChatbotWrapper() {
  const location = useLocation();
  if (location.pathname !== "/patient") return null;

  const context = useContext(UserContext);
  const user = context?.user || JSON.parse(localStorage.getItem("user"));
  const token = context?.token || localStorage.getItem("token");

  const userId = user?._id;
  const authToken = token;

  if (!userId || !authToken) {
    return <p className="text-center text-red-500 mt-4">Please log in to use the chatbot.</p>;
  }

  return <ChatWidget userId={userId} authToken={authToken} />;
}

function App() {
  return (
    <UserProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patient" element={<Patient />} />
        </Routes>

        {/* ChatWidget will only appear on /patient */}
        <ChatbotWrapper />
      </Router>
    </UserProvider>
  );
}

export default App;