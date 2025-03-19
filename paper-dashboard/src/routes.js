/*!

=========================================================
* Paper Dashboard React - v1.3.2
=========================================================

* Product Page: https://www.creative-tim.com/product/paper-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

* Licensed under MIT (https://github.com/creativetimofficial/paper-dashboard-react/blob/main/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
// routes.js

import Dashboard from "views/Dashboard.js";
import Notifications from "views/Notifications.js";
import Devices from "views/Devices.js";
import LoginPage from "views/Login.js";
import UserPage from "views/User.js";

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
