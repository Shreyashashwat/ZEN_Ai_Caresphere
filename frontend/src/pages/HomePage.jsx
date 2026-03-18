import React, { useState } from "react";

const HomePage = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });

  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleRegisterChange = (e) =>
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert("Login submitted!");
  };
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    alert("Register submitted!");
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('/medical-technology-icon-set-health-wellness.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/40  backdrop-blur-xs"></div>

      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Logo */}
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
          Care<span className="text-blue-300">Sphere</span>
        </h1>
        <p className="text-white/80 mb-6 text-center text-lg max-w-md">
          Track your medications, set reminders, and stay healthy!
        </p>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md w-full max-w-md p-8 rounded-3xl shadow-xl border border-white/20 transition-all duration-300">
          {/* Toggle */}
          <div className="flex justify-center mb-6 rounded-full bg-gray-200/40 p-1">
            <button
              onClick={() => setShowLogin(true)}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                showLogin
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                !showLogin
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          {showLogin ? (
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-shadow shadow-md">
                Login
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleRegisterSubmit}>
              <input
                type="text"
                name="name"
                value={registerData.name}
                onChange={handleRegisterChange}
                placeholder="Name"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />

              {/* Age and Gender */}
              <div className="flex gap-4">
                <input
                  type="number"
                  name="age"
                  value={registerData.age}
                  onChange={handleRegisterChange}
                  placeholder="Age"
                  min="0"
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
                <select
                  name="gender"
                  value={registerData.gender}
                  onChange={handleRegisterChange}
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-shadow shadow-md">
                Register
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;