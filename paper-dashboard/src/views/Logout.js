import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Logout = () => {
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    // Clear any session or authentication data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userToken"); // If you store the JWT or any user-specific info here
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userToken"); // If you use sessionStorage for token

    // Redirect to the login page after logout
    navigate("/admin/login"); // Use navigate to redirect
  }, [navigate]);

  return <div>Logging you out...</div>; // Optional: Add a loading state while logging out
};

export default Logout;
