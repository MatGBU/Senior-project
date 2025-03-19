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

function Devices() {
  // Function to handle "Turn On" button click
  const handleTurnOn = (input) => {
    axios
      .get(`http://127.0.0.1:8000/turn_on?input=${input}`)  // FastAPI backend URL
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
      .get(`http://127.0.0.1:8000/turn_off?input=${input}`)  // FastAPI backend URL
      .then((response) => {
        console.log(response.data.status);  // Log the response message
      })
      .catch((error) => {
        console.error("There was an error turning off the device:", error);
      });
  };

  const handleSchedule = (input) => {
    axios
      .get(`http://127.0.0.1:8000/schedule?input=${input}`)  // FastAPI backend URL
      .then((response) => {
        console.log(response.data.status);  // Log the response message
      })
      .catch((error) => {
        console.error("There was an error scheduling the device:", error);
      });
  }
  const handleDeleteSchedule = (input) => {
    axios
      .get(`http://127.0.0.1:8000/delete_schedule?input=${input}`)  // FastAPI backend URL
      .then((response) => {
        console.log(response.data.status);  // Log the response message
      })
      .catch((error) => {
        console.error("There was an error scheduling the device:", error);
      });
  }

  return (
    <>
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Kasa Smart Wi-Fi Power Strip</CardTitle>
              </CardHeader>
              <CardBody>
                {/* Row for "Turn On" buttons */}
                <Row>
                  <Col>
                    <Button color="success" onClick={() => handleTurnOn(0)}>
                      Turn On - 0
                    </Button>
                  </Col>
                  <Col>
                    <Button color="success" onClick={() => handleTurnOn(1)}>
                      Turn On - 1
                    </Button>
                  </Col>
                  <Col>
                    <Button color="success" onClick={() => handleTurnOn(2)}>
                      Turn On - 2
                    </Button>
                  </Col>
                </Row>
  
                {/* Row for "Turn Off" buttons */}
                <Row className="mt-2">
                  <Col>
                    <Button color="danger" onClick={() => handleTurnOff(0)}>
                      Turn Off - 0
                    </Button>
                  </Col>
                  <Col>
                    <Button color="danger" onClick={() => handleTurnOff(1)}>
                      Turn Off - 1
                    </Button>
                  </Col>
                  <Col>
                    <Button color="danger" onClick={() => handleTurnOff(2)}>
                      Turn Off - 2
                    </Button>
                  </Col>
                </Row>
  
                {/* Row for "Schedule" buttons */}
                <Row className="mt-2">
                  <Col>
                    <Button color="primary" onClick={() => handleSchedule(0)}>
                      Schedule - 0
                    </Button>
                  </Col>
                  <Col>
                    <Button color="primary" onClick={() => handleSchedule(1)}>
                      Schedule - 1
                    </Button>
                  </Col>
                  <Col>
                    <Button color="primary" onClick={() => handleSchedule(2)}>
                      Schedule - 2
                    </Button>
                  </Col>
                </Row>
  
                {/* Row for "Delete Schedule" buttons */}
                <Row className="mt-2">
                  <Col>
                    <Button color="warning" onClick={() => handleDeleteSchedule(0)}>
                      Delete Schedule - 0
                    </Button>
                  </Col>
                  <Col>
                    <Button color="warning" onClick={() => handleDeleteSchedule(1)}>
                      Delete Schedule - 1
                    </Button>
                  </Col>
                  <Col>
                    <Button color="warning" onClick={() => handleDeleteSchedule(2)}>
                      Delete Schedule - 2
                    </Button>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
  
}

export default Devices;
