import React from "react";
import axios from "axios"; // Import axios for making HTTP requests
// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Button,
  Row,
  Col,
} from "reactstrap";

import { FaPowerOff, FaClock, FaTrashAlt, FaPlus } from "react-icons/fa";

function Devices() {
  // Function to handle "Turn On" button click
  const handleTurnOn = (input) => {
    axios
      .get(`https://fast-kid-sterling.ngrok-free.app/turn_on?input=${input}`, {
        headers: {
          "ngrok-skip-browser-warning": "69420",  // Custom header
        },
      })
      .then((response) => {
        console.log(response.data.status);  // Log the response message
      })
      .catch((error) => {
        console.error("There was an error turning on the device:", error);
      });
  };


  // Function to handle "Turn Off" button click
  const handleTurnOff = (input) => {
    axios
      .get(`https://fast-kid-sterling.ngrok-free.app/turn_off?input=${input}`, { 
        headers: { 
          "ngrok-skip-browser-warning": "69420", 
        },
      })  // FastAPI backend URL
      .then((response) => {
        console.log(response.data.status);  // Log the response message
      })
      .catch((error) => {
        console.error("There was an error turning off the device:", error);
      });
  };

  const handleSchedule = (input) => {
    axios
      .get(`https://fast-kid-sterling.ngrok-free.app/schedule?input=${input}`, {
        headers: {
          "ngrok-skip-browser-warning": "69420", 
        },
      })  // FastAPI backend URL
      .then((response) => {
        console.log(response.data.status);  // Log the response message
      })
      .catch((error) => {
        console.error("There was an error scheduling the device:", error);
      });
  }
  const handleDeleteSchedule = (input) => {
    axios
      .get(`https://fast-kid-sterling.ngrok-free.app/delete_schedule?input=${input}`, {
        headers: {
          "ngrok-skip-browser-warning": "69420",
        },
      })  // FastAPI backend URL
      .then((response) => {
        console.log(response.data.status);  // Log the response message
      })
      .catch((error) => {
        console.error("There was an error scheduling the device:", error);
      });
  }
  const handleTurnOnAll = () => {
    // Turn on all outlets
    handleTurnOn(0);
    handleTurnOn(1);
    handleTurnOn(2);
  };
  
  const handleTurnOffAll = () => {
    // Turn off all outlets
    handleTurnOff(0);
    handleTurnOff(1);
    handleTurnOff(2);
  };
  
  const handleScheduleAll = () => {
    // Schedule all outlets
    handleSchedule(0);
    handleSchedule(1);
    handleSchedule(2);
  };
  
  const handleDeleteScheduleAll = () => {
    // Delete schedule for all outlets
    handleDeleteSchedule(0);
    handleDeleteSchedule(1);
    handleDeleteSchedule(2);
  };
  
  const handleAddNewDevice = () => {
    // Logic for adding a new device
    console.log("Add New Device button clicked");
  };
  
  return (
    <>
      <div className="content">
        {/* Parent Card: Kasa Smart Power Strip */}
        <Card className="window-card">
          <CardHeader>
            <CardTitle tag="h4">Kasa Smart Wi-Fi Power Strip</CardTitle>
          </CardHeader>
          <CardBody>
            {/* Global Buttons: Turn On, Turn Off, Schedule, Remove Schedule */}
            <Row className="mb-4">
              <Col md="3">
                <Button color="success" block onClick={handleTurnOnAll} title="Turn On All Outlets">
                  <FaPowerOff /> Turn On All
                </Button>
              </Col>
              <Col md="3">
                <Button color="danger" block onClick={handleTurnOffAll} title="Turn Off All Outlets">
                  <FaPowerOff /> Turn Off All
                </Button>
              </Col>
              <Col md="3">
                <Button color="primary" block onClick={handleScheduleAll} title="Schedule All Outlets">
                  <FaClock /> Schedule All
                </Button>
              </Col>
              <Col md="3">
                <Button color="warning" block onClick={handleDeleteScheduleAll} title="Delete Schedule for All">
                  <FaTrashAlt /> Delete Schedule All
                </Button>
              </Col>
            </Row>
  
            {/* Row for Outlet 1, Outlet 2, and Outlet 3 */}
            <Row>
              {/* Outlet 1 */}
              <Col md="4">
                <Card className="outlet-card">
                  <CardHeader>
                    <CardTitle tag="h5">Outlet 1</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Button
                      color="success"
                      size="sm"
                      block
                      onClick={() => handleTurnOn(0)}
                      title="Turn On Outlet 1"
                    >
                      <FaPowerOff /> Turn On
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      block
                      onClick={() => handleTurnOff(0)}
                      title="Turn Off Outlet 1"
                    >
                      <FaPowerOff /> Turn Off
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      block
                      onClick={() => handleSchedule(0)}
                      title="Schedule Outlet 1"
                    >
                      <FaClock /> Schedule
                    </Button>
                    <Button
                      color="warning"
                      size="sm"
                      block
                      onClick={() => handleDeleteSchedule(0)}
                      title="Delete Schedule Outlet 1"
                    >
                      <FaTrashAlt /> Delete Schedule
                    </Button>
                  </CardBody>
                </Card>
              </Col>
  
              {/* Outlet 2 */}
              <Col md="4">
                <Card className="outlet-card">
                  <CardHeader>
                    <CardTitle tag="h5">Outlet 2</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Button
                      color="success"
                      size="sm"
                      block
                      onClick={() => handleTurnOn(1)}
                      title="Turn On Outlet 2"
                    >
                      <FaPowerOff /> Turn On
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      block
                      onClick={() => handleTurnOff(1)}
                      title="Turn Off Outlet 2"
                    >
                      <FaPowerOff /> Turn Off
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      block
                      onClick={() => handleSchedule(1)}
                      title="Schedule Outlet 2"
                    >
                      <FaClock /> Schedule
                    </Button>
                    <Button
                      color="warning"
                      size="sm"
                      block
                      onClick={() => handleDeleteSchedule(1)}
                      title="Delete Schedule Outlet 2"
                    >
                      <FaTrashAlt /> Delete Schedule
                    </Button>
                  </CardBody>
                </Card>
              </Col>
  
              {/* Outlet 3 */}
              <Col md="4">
                <Card className="outlet-card">
                  <CardHeader>
                    <CardTitle tag="h5">Outlet 3</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Button
                      color="success"
                      size="sm"
                      block
                      onClick={() => handleTurnOn(2)}
                      title="Turn On Outlet 3"
                    >
                      <FaPowerOff /> Turn On
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      block
                      onClick={() => handleTurnOff(2)}
                      title="Turn Off Outlet 3"
                    >
                      <FaPowerOff /> Turn Off
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      block
                      onClick={() => handleSchedule(2)}
                      title="Schedule Outlet 3"
                    >
                      <FaClock /> Schedule
                    </Button>
                    <Button
                      color="warning"
                      size="sm"
                      block
                      onClick={() => handleDeleteSchedule(2)}
                      title="Delete Schedule Outlet 3"
                    >
                      <FaTrashAlt /> Delete Schedule
                    </Button>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </CardBody>
        </Card>
  
        {/* Add New Device Card */}
        <Card className="window-card mt-4">
          <CardHeader>
            <CardTitle tag="h4">Add New Device</CardTitle>
          </CardHeader>
          <CardBody>
            <Button color="dark" block onClick={handleAddNewDevice} title="Add New Device">
              <FaPlus /> Add New Device
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );

}

export default Devices;
