
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api";

const HomePage = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);
  
  const [userRole, setUserRole] = useState("user"); // 'user' or 'doctor'

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    doctorCode: "",
  });

  const clearForms = () => {
    setLoginData({ email: "", password: "" });
    setRegisterData({
      username: "",
      email: "",
      password: "",
      age: "",
      gender: "",
      doctorCode: "",
    });
  };

  const handleToggle = (isLogin) => {
    setShowLogin(isLogin);
    clearForms();
  };

  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleGoogleLogin = () => {
  // Redirect directly to backend Google OAuth
  window.location.href = "http://localhost:8000/api/v1/auth/google";
};


  const handleRegisterChange = (e) =>
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  // ------------------- Updated Login Submit -------------------
  
const handleLoginSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await loginUser(loginData);
    const { user, token } = res.data.data;

    localStorage.setItem(
      "user",
      JSON.stringify({ _id: user._id, username: user.username, token })
    );

    // ✅ ALWAYS go to patient
    navigate("/patient");

  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed! Check credentials.");
  }
};

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...loginData, role: userRole };
      const res = await loginUser(payload);
      
      const { user, token } = res.data.data;

      localStorage.setItem(
        "user",
        JSON.stringify({ _id: user._id, username: user.username, role: userRole, token })
      );

      if (userRole === "doctor") {
        navigate("/doctor");
      } else {
        if (!user.hasGoogleAccount && userRole === "user") {
        }
        navigate("/patient");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errMsg = error.response?.data?.message || "Login failed! Check credentials.";
      alert(errMsg);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const payload = {
        ...registerData,
        role: userRole,
        age: userRole === 'user' ? registerData.age : undefined, 
        gender: userRole === 'user' ? registerData.gender : undefined,
    };

    try {
      await registerUser(payload);
      alert(`Registration successful as ${userRole === 'doctor' ? 'Doctor' : 'Patient'}! Please login.`);
      handleToggle(true); // Switch to login view
    } catch (error) {
      console.error("Register error:", error);
      const errMsg = error.response?.data?.message || "Registration failed!";
      alert(errMsg);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/medical-technology-icon-set-health-wellness.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs"></div>
      <div className="relative z-10 flex flex-col items-center px-4 w-full">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 drop-shadow-lg text-center">
          Care<span className="text-blue-300">Sphere</span>
        </h1>
        <p className="text-white/80 mb-6 text-center text-lg max-w-md">
          Track your medications, set reminders, and stay healthy!
        </p>

        <div className="bg-white/95 backdrop-blur-md w-full max-w-md p-8 rounded-3xl shadow-xl border border-white/20 transition-all duration-300">
          
          <div className="flex justify-center mb-4 rounded-full bg-gray-200/50 p-1">
            <button
              onClick={() => handleToggle(true)}
              className={`flex-1 px-6 py-2 rounded-full font-semibold transition ${
                showLogin ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleToggle(false)}
              className={`flex-1 px-6 py-2 rounded-full font-semibold transition ${
                !showLogin ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Register
            </button>
          </div>

          <div className="flex justify-center gap-6 mb-6">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="radio"
                name="role"
                value="user"
                checked={userRole === "user"}
                onChange={() => setUserRole("user")}
                className="accent-blue-600 w-4 h-4"
              />
              <span className={`font-medium transition-colors ${userRole === 'user' ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                Patient
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="radio"
                name="role"
                value="doctor"
                checked={userRole === "doctor"}
                onChange={() => setUserRole("doctor")}
                className="accent-blue-600 w-4 h-4"
              />
              <span className={`font-medium transition-colors ${userRole === 'doctor' ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                Doctor
              </span>
            </label>
          </div>

          {showLogin ? (
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
  <input
    type="email"
    name="email"
    value={loginData.email}
    onChange={handleLoginChange}
    placeholder="Email"
    required
    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400"
  />

  <input
    type="password"
    name="password"
    value={loginData.password}
    onChange={handleLoginChange}
    placeholder="Password"
    required
    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400"
  />

  <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">
    Login
  </button>

  {/* Google Sign In */}
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-300"></div>
    <span className="text-gray-500 text-sm">OR</span>
    <div className="flex-1 h-px bg-gray-300"></div>
  </div>

  <button
    type="button"
    onClick={handleGoogleLogin}
    className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100"
  >
    <img
      src="https://developers.google.com/identity/images/g-logo.png"
      className="w-5 h-5"
      alt="Google"
    />
    Sign in with Google
  </button>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <input
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                placeholder={userRole === "doctor" ? "Dr. Full Name" : "Username"}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Email Address"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Create Password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              {/* Conditional Patient Fields */}
              {userRole === "user" && (
                <div className="flex gap-4">
                  <input
                    type="number"
                    name="age"
                    value={registerData.age}
                    onChange={handleRegisterChange}
                    placeholder="Age"
                    min="0"
                    required
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <select
                    name="gender"
                    value={registerData.gender}
                    onChange={handleRegisterChange}
                    required
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {/* Doctor Code (Context aware) */}
              <div>
                <input
                    type="text"
                    name="doctorCode"
                    value={registerData.doctorCode}
                    onChange={handleRegisterChange}
                    placeholder={userRole === "doctor" ? "Create Unique Doctor Code" : "Doctor Code to Connect"}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
                />
                 {userRole === "doctor" && (
                     <p className="text-xs text-gray-500 mt-1 ml-1">Patients will use this code to connect with you.</p>
                 )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-shadow shadow-md mt-2"
              >
                Register as {userRole === "doctor" ? "Doctor" : "Patient"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;