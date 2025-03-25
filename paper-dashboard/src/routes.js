
import Dashboard from "views/Dashboard.js";
import Notifications from "views/Notifications.js";
import Devices from "views/Devices.js";
import LoginPage from "views/Login.js";
import UserPage from "views/User.js";
import Logout from "views/Logout.js";


const getRoutes = (isLoggedIn) => {
  // Common routes that are always visible
  const commonRoutes = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: "nc-icon nc-bank",
      component: <Dashboard />,
      layout: "/admin",
    },
    {
      path: "/notifications",
      name: "Notifications",
      icon: "nc-icon nc-bell-55",
      component: <Notifications />,
      layout: "/admin",
    },
  ];

  // Routes that are only visible to logged-in users
  const loggedInRoutes = [
    {
      path: "/devices",
      name: "Devices",
      icon: "nc-icon nc-app",
      component: <Devices />,
      layout: "/admin",
    },
    {
      pro: true,
      path: "/logout",
      name: "Logout",
      icon: "nc-icon nc-minimal-left",
      component: <Logout />,
      layout: "/admin",
    },
    {
      path: "/user-page",
      name: "User Profile",
      icon: "nc-icon nc-single-02",
      component: <UserPage />,
      layout: "/admin",
    },
  ];

  // Routes that are only visible to logged-out users
  const loggedOutRoutes = [
    {
      path: "/devices",
      name: "Devices",
      icon: "nc-icon nc-app",
      component: <Devices />,
      layout: "/admin",
    },
    {
      path: "/login",
      name: "Login",
      icon: "nc-icon nc-lock-circle-open",
      component: <LoginPage />,
      layout: "/admin",
    },
  ];

  // If the user is logged in, return the common and logged-in routes
  // localStorage.clear();
  if (isLoggedIn) {
    return [...commonRoutes, ...loggedInRoutes];
  }
  console.log("we hit this");
  console.log(Array.isArray([...commonRoutes, ...loggedOutRoutes]));
  // If the user is not logged in, return only the common routes and login route
  return [...commonRoutes, ...loggedOutRoutes];
};

export default getRoutes;
