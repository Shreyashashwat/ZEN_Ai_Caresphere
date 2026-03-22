import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, setUser, setToken } = useContext(UserContext);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    navigate("/");
  };

  return (
    <header className="bg-gradient-to-r from-blue-500 to-indigo-600 px-10 py-4 text-white flex items-center justify-between shadow-lg">

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-wide">CareSphere</h1>
        <p className="text-sm italic opacity-90">
          Your personal medicine companion
        </p>
      </div>


      <div className="flex items-center gap-8">
        <nav>
          <ul className="flex gap-8">
            <li>
              <a
                href="/"
                className="text-lg font-medium hover:text-yellow-300 transition-colors duration-200"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/about"
                className="text-lg font-medium hover:text-yellow-300 transition-colors duration-200"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="text-lg font-medium hover:text-yellow-300 transition-colors duration-200"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>

        {user && (
          <button
            onClick={handleSignOut}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2 rounded-full transition-colors duration-200 border border-white/30"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
