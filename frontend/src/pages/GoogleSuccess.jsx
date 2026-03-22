import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useContext(UserContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const _id = params.get("userId");
    const username = params.get("username");
    const role = params.get("role"); // ← add this

    if (!token || !_id) {
      navigate("/");
      return;
    }

    const userObj = { _id, username, token, role: role || "user" }; // ← store role

    localStorage.setItem("user", JSON.stringify(userObj));
    setUser(userObj);
    setToken(token);

    setTimeout(() => {
      // ← redirect based on role
      if (role === "doctor") {
        navigate("/doctor");
      } else {
        navigate("/patient");
      }
    }, 100);

  }, [navigate, setUser, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
};

export default GoogleSuccess;