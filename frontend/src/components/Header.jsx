import React from "react";

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-500 to-indigo-600 px-10 py-4 text-white flex items-center justify-between shadow-lg">
      {/* Left side: Logo and tagline */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-wide">CareSphere</h1>
        <p className="text-sm italic opacity-90">
          Your personal medicine companion
        </p>
      </div>

      {/* Right side: Navigation */}
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
    </header>
  );
};

export default Header;