
import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);


  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setToken(storedUser.token || null);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken }}>
      {children}
    </UserContext.Provider>
  );
};
