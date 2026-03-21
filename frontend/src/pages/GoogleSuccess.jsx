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

    if (!token || !_id) {
      navigate("/");
      return;
    }

    const userObj = { _id, username, token };
    
    // Set localStorage
    localStorage.setItem("user", JSON.stringify(userObj));
    
    // Set context
    setUser(userObj);
    setToken(token);
    
    // Navigate after a small delay to ensure context updates
    setTimeout(() => {
      navigate("/patient");
    }, 100);
    
  }, [navigate, setUser, setToken]); // ✅ Add dependencies

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default GoogleSuccess;