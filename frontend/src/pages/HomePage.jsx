import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api";

const HomePage = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);

  // Shared Role State (Applies to both Login and Register)
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

  const handleRegisterChange = (e) =>
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  const handleGoogleLogin = () => {
    // Redirect directly to backend Google OAuth
    window.location.href = "http://localhost:8000/api/v1/auth/google";
  };

  // ------------------- Login Logic -------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      // Pass the selected role to the backend
      const payload = { ...loginData, role: userRole };
      const res = await loginUser(payload);

      const { user, token } = res.data.data;

      // Save user info locally
      localStorage.setItem(
        "user",
        JSON.stringify({ _id: user._id, username: user.username, role: user.role || userRole, token })
      );

      // Redirect based on role
      if (user.role === "doctor" || userRole === "doctor") {
        navigate("/doctor");
      } else {
        // Patient Flow: Optional Google Auth Check
        if (!user.hasGoogleAccount) {
           // If your app requires Google link immediately:
           // window.location.href = `http://localhost:8000/api/v1/auth/google?token=${token}`;
           // return;
        }
        navigate("/patient");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errMsg = error.response?.data?.message || "Login failed! Check credentials.";
      alert(errMsg);
    }
  };

  // ------------------- Register Logic -------------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...registerData,
      role: userRole,
      // Send undefined for age/gender if Doctor to keep payload clean
      age: userRole === "user" ? registerData.age : undefined,
      gender: userRole === "user" ? registerData.gender : undefined,
    };

    try {
      await registerUser(payload);
      alert(
        `Registration successful as ${userRole === "doctor" ? "Doctor" : "Patient"}! Please login.`
      );
      handleToggle(true);
    } catch (error) {
      console.error("Register error:", error);
      const errMsg = error.response?.data?.message || "Registration failed!";
      alert(errMsg);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center px-4 py-10 sm:px-6"
      style={{ backgroundImage: "url('/medical-technology-icon-set-health-wellness.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center justify-center">
        <div className="mb-6 text-center text-white">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Care<span className="text-blue-300">Sphere</span>
          </h1>
          <p className="mt-3 text-sm text-blue-100 sm:text-base">
            Track your medications, set reminders, and stay healthy.
          </p>
        </div>

        <section className="w-full rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md transition duration-300 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-700 sm:text-3xl">
              {showLogin ? "Welcome Back" : "Create Your Account"}
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              {showLogin
                ? "Sign in to continue your health journey."
                : "Join CareSphere for personalized, connected care."}
            </p>
          </div>

          <div className="mb-5 flex justify-center rounded-full bg-gray-200/60 p-1">
            <button
              onClick={() => handleToggle(true)}
              className={`flex-1 rounded-full px-5 py-2.5 font-semibold transition ${
                showLogin
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleToggle(false)}
              className={`flex-1 rounded-full px-5 py-2.5 font-semibold transition ${
                !showLogin
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Register
            </button>
          </div>

          <div className="mb-6 flex justify-center gap-6 rounded-xl bg-blue-50 p-3">
            <label className="group flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="role"
                value="user"
                checked={userRole === "user"}
                onChange={() => setUserRole("user")}
                className="h-4 w-4 accent-blue-600"
              />
              <span
                className={`font-medium transition-colors ${
                  userRole === "user"
                    ? "text-blue-600"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              >
                Patient
              </span>
            </label>
            <label className="group flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="role"
                value="doctor"
                checked={userRole === "doctor"}
                onChange={() => setUserRole("doctor")}
                className="h-4 w-4 accent-blue-600"
              />
              <span
                className={`font-medium transition-colors ${
                  userRole === "doctor"
                    ? "text-blue-600"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              >
                Doctor
              </span>
            </label>
          </div>

          {showLogin ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Email Address"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Password"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
              >
                Login as {userRole === "doctor" ? "Doctor" : "Patient"}
              </button>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-300" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="h-px flex-1 bg-gray-300" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 transition duration-200 hover:bg-gray-100"
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  className="h-5 w-5"
                  alt="Google"
                />
                Sign in with Google
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <input
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                placeholder={userRole === "doctor" ? "Dr. Full Name" : "Username"}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Email Address"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Create Password"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />

              {userRole === "user" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="number"
                    name="age"
                    value={registerData.age}
                    onChange={handleRegisterChange}
                    placeholder="Age"
                    min="0"
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <select
                    name="gender"
                    value={registerData.gender}
                    onChange={handleRegisterChange}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <input
                  type="text"
                  name="doctorCode"
                  value={registerData.doctorCode}
                  onChange={handleRegisterChange}
                  placeholder={
                    userRole === "doctor"
                      ? "Create Unique Doctor Code"
                      : "Doctor Code to Connect"
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 uppercase transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {userRole === "doctor" && (
                  <p className="ml-1 mt-1 text-xs text-gray-500">
                    Patients will use this code to connect with you.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
              >
                Register as {userRole === "doctor" ? "Doctor" : "Patient"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;