import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Button,
  Row,
  Col,
  Input,
} from "reactstrap";
import { FaPowerOff, FaClock, FaTrashAlt, FaPlus } from "react-icons/fa";

function Devices() {
  const [baseUrl, setBaseUrl] = useState(Cookies.get("baseUrl") || ""); // Load from cookie

  useEffect(() => {
    Cookies.set("baseUrl", baseUrl, { expires: 7 }); // Save to cookie
  }, [baseUrl]);

  const handleApiRequest = (endpoint, input) => {
    if (!baseUrl) {
      console.error("Base URL is empty. Please enter a valid URL.");
      return;
    }
    axios
      .get(`${baseUrl}/${endpoint}?input=${input}`, {
        headers: {
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        console.log(response.data.status);
      })
      .catch((error) => {
        console.error(`Error with ${endpoint}:`, error);
      });
  };

  return (
    <>
      <div className="content">
        <Card className="window-card">
          <CardHeader>
            <CardTitle tag="h4">Enter API Base URL</CardTitle>
          </CardHeader>
          <CardBody>
            <Input
              type="text"
              placeholder="Enter API Base URL..."
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </CardBody>
        </Card>

        <Card className="window-card mt-4">
          <CardHeader>
            <CardTitle tag="h4">Kasa Smart Wi-Fi Power Strip</CardTitle>
          </CardHeader>
          <CardBody>
            <Row className="mb-4">
              <Col md="3">
                <Button color="success" block onClick={() => handleApiRequest("turn_on", "all")}>
                  <FaPowerOff /> Turn On All
                </Button>
              </Col>
              <Col md="3">
                <Button color="danger" block onClick={() => handleApiRequest("turn_off", "all")}>
                  <FaPowerOff /> Turn Off All
                </Button>
              </Col>
              <Col md="3">
                <Button color="primary" block onClick={() => handleApiRequest("schedule", "all")}>
                  <FaClock /> Schedule All
                </Button>
              </Col>
              <Col md="3">
                <Button color="warning" block onClick={() => handleApiRequest("delete_schedule", "all")}>
                  <FaTrashAlt /> Delete Schedule All
                </Button>
              </Col>
            </Row>

            <Row>
              {[0, 1, 2].map((outlet) => (
                <Col md="4" key={outlet}>
                  <Card className="outlet-card">
                    <CardHeader>
                      <CardTitle tag="h5">Outlet {outlet + 1}</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <Button color="success" size="sm" block onClick={() => handleApiRequest("turn_on", outlet)}>
                        <FaPowerOff /> Turn On
                      </Button>
                      <Button color="danger" size="sm" block onClick={() => handleApiRequest("turn_off", outlet)}>
                        <FaPowerOff /> Turn Off
                      </Button>
                      <Button color="primary" size="sm" block onClick={() => handleApiRequest("schedule", outlet)}>
                        <FaClock /> Schedule
                      </Button>
                      <Button color="warning" size="sm" block onClick={() => handleApiRequest("delete_schedule", outlet)}>
                        <FaTrashAlt /> Delete Schedule
                      </Button>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

export default Devices;