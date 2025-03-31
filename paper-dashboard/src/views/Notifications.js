import React, { useRef, useEffect, useState } from "react";
import NotificationAlert from "react-notification-alert";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
} from "reactstrap";

function Notifications() {
  const notificationAlert = useRef(null);

  // State to hold all notifications (new + old).
  // We'll load from localStorage on mount, and add new ones in code.
  const [storedNotifications, setStoredNotifications] = useState([]);

  // --- 1) Load notifications from localStorage on component mount ---
  useEffect(() => {
    const saved = localStorage.getItem("notifications");
    if (saved) {
      setStoredNotifications(JSON.parse(saved));
    }
  }, []);

  // A helper function to persist notifications to localStorage
  const persistNotifications = (notifications) => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  };

  // --- 2) A function to create a new notification ---
  // and show it with react-notification-alert
  const addNotification = (message) => {
    // Create a new notification object
    const now = new Date();
    const newNotification = {
      id: now.getTime(),         // unique ID (timestamp)
      date: now.toISOString(),   // store ISO date
      message: message,
    };

    // Insert at the front so it's "on top"
    const updated = [newNotification, ...storedNotifications];
    setStoredNotifications(updated);
    persistNotifications(updated);

    // Also show the "popup" notification with react-notification-alert
    if (notificationAlert.current) {
      const options = {
        place: "tr", // top-right corner, for example
        message: (
          <div>
            <b>{message}</b>
          </div>
        ),
        type: "info", // or success/warning/etc.
        icon: "nc-icon nc-bell-55",
        autoDismiss: 7,
      };
      notificationAlert.current.notificationAlert(options);
    }
  };

  // --- 3) Example: fetch CSV, compute today's renewable data, add a notification ---
  useEffect(() => {
    async function fetchRenewableData() {
      try {
        // FETCH your CSV
        // Make sure "/data/energy_predictions.csv" is correct path
        const response = await fetch("/data/energy_predictions.csv");
        const csvText = await response.text();
        const rows = csvText.split("\n").map((r) => r.split(","));
        if (rows.length < 2) {
          return; // no data
        }

        // CSV headers might be:
        // 0=BeginDate, 1=Total_Predicted, 2=Hydro, 3=Nuclear, 4=Wind, 5=Solar, 6=Refuse, 7=Wood
        const headers = rows[0];
        const dataRows = rows.slice(1).filter(
          (r) => r.length === headers.length && r[0].trim() !== ""
        );

        // Identify "today" as YYYY-MM-DD
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRows = dataRows.filter((row) => row[0].startsWith(todayStr));
        if (todayRows.length === 0) {
          return; // no data for today
        }

        // We'll find the row with the largest sum of (Hydro+Nuclear+Wind+Solar+Refuse+Wood)
        let bestSum = -Infinity;
        let bestDateTime = null;

        todayRows.forEach((row) => {
          const hydro = parseFloat(row[2]) || 0;
          const nuclear = parseFloat(row[3]) || 0;
          const wind = parseFloat(row[4]) || 0;
          const solar = parseFloat(row[5]) || 0;
          const refuse = parseFloat(row[6]) || 0;
          const wood = parseFloat(row[7]) || 0;

          const sum = hydro + nuclear + wind + solar + refuse + wood;
          if (sum > bestSum) {
            bestSum = sum;
            bestDateTime = row[0]; // entire "YYYY-MM-DD HH:mm:ss"
          }
        });

        if (bestDateTime) {
          const timePart = bestDateTime.split(" ")[1] || "Unknown time";
          // Compose a message for the notification
          const message = `Today's highest renewable output: ~${bestSum.toFixed(
            2
          )} MW at ${timePart}`;
          addNotification(message);
        }
      } catch (error) {
        console.error("Error fetching CSV:", error);
      }
    }

    fetchRenewableData();
  }, []); // run once on mount

  // --- 4) Render the notifications tab ---
  // We’ll show "today’s" notifications first because we always add them at the front
  // Then any older ones in the same list

  // if you'd like them grouped by day, you can do more advanced sorting here

  return (
    <>
      <div className="content">
        <NotificationAlert ref={notificationAlert} />
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h5">Notifications</CardTitle>
                <p className="card-category">
                  {storedNotifications.length === 0
                    ? "You have no new notifications"
                    : `You have ${storedNotifications.length} notification(s)`}
                </p>
              </CardHeader>
              <CardBody>
                {/* Display all notifications in descending order (newest first) */}
                {storedNotifications.map((notif) => {
                  const dateString = new Date(notif.date).toLocaleString();
                  return (
                    <div
                      key={notif.id}
                      style={{
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <strong>{dateString}</strong>
                      <p>{notif.message}</p>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Notifications;
