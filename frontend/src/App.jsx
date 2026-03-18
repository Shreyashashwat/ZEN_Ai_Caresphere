import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import Patient from "./pages/patient";
import Header from "./components/Header";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patient" element={<Patient />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;