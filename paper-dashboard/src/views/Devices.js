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
  Table,
} from "reactstrap";
import { FaPowerOff, FaClock, FaTrashAlt, FaPlus, FaCheck } from "react-icons/fa";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function Devices() {
  const [baseUrl, setBaseUrl] = useState(Cookies.get("baseUrl") || "");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [savedUrls, setSavedUrls] = useState(JSON.parse(Cookies.get("savedUrls") || "[]"));
  const [isDeviceActive, setIsDeviceActive] = useState(false);

  // Function to validate URL format
  const validateUrl = (url) => {
    const urlPattern = /^(https?:\/\/)([\w-]+\.)+[\w-]+(\/.*)?$/;
    return urlPattern.test(url);
  };

  const handleAddUrl = () => {
    if (validateUrl(baseUrl) && !savedUrls.includes(baseUrl)) {
      const newUrls = [...savedUrls, baseUrl];
      setSavedUrls(newUrls);
      Cookies.set("savedUrls", JSON.stringify(newUrls), { expires: 30 });
    }
  };

  const handleUseDevice = () => {
    if (validateUrl(baseUrl)) {
      setIsDeviceActive(true);
      setIsValidUrl(true);
    }
  };

  const handleApiRequest = (endpoint, input) => {
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

  const handleDeleteUrl = (url) => {
    const filteredUrls = savedUrls.filter((item) => item !== url);
    setSavedUrls(filteredUrls);
    Cookies.set("savedUrls", JSON.stringify(filteredUrls), { expires: 30 });
  };

  const handleBaseUrlChange = (e) => {
    const newUrl = e.target.value;
    setBaseUrl(newUrl);
    setIsDeviceActive(false);
    setIsValidUrl(false);
    setRtData({});
  };

  const [rtData, setRtData] = useState({});

  useEffect(() => {
    if (isValidUrl && isDeviceActive) {
      axios
        .get(`${baseUrl}/get_rt_data`, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
          },
        })
        .then((response) => {
          console.log("Real-time data:", response.data);
          setRtData(response.data); // Store data in state
        })
        .catch((error) => {
          console.error("Error fetching real-time data:", error);
        });
    }
  }, [isValidUrl, isDeviceActive, baseUrl]);

  const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", 
    "#FF9F40", "#FF5733", "#C70039", "#FFC0CB", "#800080", 
    "#00FFFF"
  ];  

  const chartData = {
    labels: [], // This will store the sources
    datasets: [{
      data: [], // This will store the generation values (in MW)
    }],
  };

  if (Object.keys(rtData).length > 0) {
    // Assuming you want to show data for the first timestamp (time)
    const firstTimestamp = Object.keys(rtData)[0];
    const data = rtData[firstTimestamp];
    chartData.labels = Object.keys(data); // Labels for the pie chart are the sources
    chartData.datasets[0].data = Object.values(data); // Data values are the generation (MW) values
    chartData.datasets[0].backgroundColor = chartData.labels.map((_, idx) => colors[idx % colors.length]);   
  }



  return (
    <>
      <div className="content">
        {/* Base URL Input */}
        <Card className="window-card">
          <CardHeader>
            <CardTitle tag="h4">Enter API Base URL</CardTitle>
          </CardHeader>
          <CardBody>
            <Row className="align-items-center">
              <Col md="7">
                <Input
                  type="text"
                  placeholder="Enter API Base URL..."
                  value={baseUrl}
                  onChange={handleBaseUrlChange}
                />
              </Col>
              <Col md="2">
                <Button color="primary" block onClick={handleAddUrl} disabled={!validateUrl(baseUrl)}>
                  <FaPlus /> Add
                </Button>
              </Col>
              <Col md="3">
                <Button color="success" block onClick={handleUseDevice} disabled={!validateUrl(baseUrl)}>
                  <FaCheck /> Use Device
                </Button>
              </Col>
            </Row>
            {baseUrl && !validateUrl(baseUrl) && (
              <p style={{ color: "red" }}>Invalid URL format. Use http://example.app</p>
            )}
          </CardBody>
        </Card>

        {/* Saved Base URLs */}
        <Card className="window-card mt-4">
          <CardHeader>
            <CardTitle tag="h4">Saved Base URLs</CardTitle>
          </CardHeader>
          <CardBody>
            {savedUrls.length > 0 ? (
              savedUrls.map((url, index) => (
                <Row key={index} className="mb-2">
                  <Col md="8">
                    <Button color="link" onClick={() => setBaseUrl(url)}>
                      {url}
                    </Button>
                  </Col>
                  <Col md="4">
                    <Button color="danger" size="sm" onClick={() => handleDeleteUrl(url)}>
                      <FaTrashAlt /> Delete
                    </Button>
                  </Col>
                </Row>
              ))
            ) : (
              <p>No saved URLs.</p>
            )}
          </CardBody>
        </Card>

        {isValidUrl && isDeviceActive && (
          <Card className="window-card mt-4">
            <CardHeader>
              <CardTitle tag="h4">Real-Time Energy Data</CardTitle>
            </CardHeader>
            <CardBody>
              {/* Check if rtData is not empty */}
              {Object.keys(rtData).length === 0 ? (
                <p>Loading data...</p> // If no data is present
              ) : (
                <Pie
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: `Real-Time Energy Generation (MW) - ${Object.keys(rtData)[0]}`,
                      },
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                  width={500}  // Set the width of the pie chart
                  height={500} 
                />
              )}
            </CardBody>
          </Card>
        )}


        {/* Power Strip Controls */}
        {isValidUrl && isDeviceActive && (
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

        )}
      </div>
    </>
  );
}

export default Devices;
