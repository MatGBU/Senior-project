import React, { useState, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col,
} from "reactstrap";

// core components
import { predictiongraph } from "../variables/charts.js";

function Dashboard() {
  const [lineChartDataone, setLineChartDataone] = useState({
    labels: [],
    datasets: [],
  });

  const [pieChartData, setPieChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [lineChartDatatwo, setLineChartDatatwo] = useState({
    labels: [],
    datasets: [],
  });

  // Fetch data for the first Line Chart
  useEffect(() => {
    async function loadLineChartDataone() {
      try {
        const response = await fetch("/data/energy_predictions.csv");
        const csvText = await response.text();

        // Parse the CSV
        const rows = csvText.split("\n").map((row) => row.split(","));
        const headers = rows[0];
        const dataRows = rows.slice(1).filter((row) => row.length === headers.length);

        const labels = dataRows.map((row) => row[0]); // Dates as labels
        const hydroData = dataRows.map((row) => parseFloat(row[1]) || 0); // Hydro
        const nuclearData = dataRows.map((row) => parseFloat(row[2]) || 0); // Nuclear
        const windData = dataRows.map((row) => parseFloat(row[3]) || 0); // Wind
        const solarData = dataRows.map((row) => parseFloat(row[4]) || 0); // Solar

        setLineChartDataone({
          labels: labels,
          datasets: [
            {
              label: "Hydro",
              borderColor: "#6bd098",
              backgroundColor: "#6bd098",
              data: hydroData,
              fill: false,
              tension: 0.4,
              borderWidth: 3,
            },
            {
              label: "Nuclear",
              borderColor: "#f17e5d",
              backgroundColor: "#f17e5d",
              data: nuclearData,
              fill: false,
              tension: 0.4,
              borderWidth: 3,
            },
            {
              label: "Wind",
              borderColor: "#fcc468",
              backgroundColor: "#fcc468",
              data: windData,
              fill: false,
              tension: 0.4,
              borderWidth: 3,
            },
            {
              label: "Solar",
              borderColor: "#1f8ef1",
              backgroundColor: "#1f8ef1",
              data: solarData,
              fill: false,
              tension: 0.4,
              borderWidth: 3,
            },
          ],
        });
      } catch (error) {
        console.error("Error loading line chart data:", error);
      }
    }

    loadLineChartDataone();
  }, []);

  // Fetch data for the Pie Chart
  useEffect(() => {
    async function loadPieChartData() {
      try {
        const response = await fetch("/data//TwoYear_Training_Set_Copy.csv");
        const csvText = await response.text();

        // Parse the CSV
        const rows = csvText.split("\n").map((row) => row.split(","));
        const headers = rows[0];
        const dataRows = rows.slice(1).filter((row) => row.length === headers.length);

        const technologyLabels = headers.slice(1, 12); // First 12 technologies
        const technologyTotals = technologyLabels.map((tech, index) =>
          dataRows.reduce((sum, row) => sum + parseFloat(row[index + 1] || 0), 0)
        );

        setPieChartData({
          labels: technologyLabels,
          datasets: [
            {
              label: "Total Generation",
              data: technologyTotals,
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#8BC34A",
                "#FF5722",
                "#9C27B0",
              ],
            },
          ],
        });
      } catch (error) {
        console.error("Error loading pie chart data:", error);
      }
    }

    loadPieChartData();
  }, []);

// Fetch data for the second Line Chart
useEffect(() => {
  async function loadLineChartDatatwo() {
    try {
      const response = await fetch("/data/energy_predictions.csv");
      const csvText = await response.text();

      // Parse the CSV
      const rows = csvText.split("\n").map((row) => row.split(","));
      const headers = rows[0];
      const dataRows = rows.slice(1).filter((row) => row.length === headers.length);

      const labels = dataRows.map((row) => row[0]); // Dates as labels
      const refuseData = dataRows.map((row) => parseFloat(row[5]) || 0); // refuse
      const woodData = dataRows.map((row) => parseFloat(row[6]) || 0); // wood

      setLineChartDatatwo({
        labels: labels,
        datasets: [
          {
            label: "Refuse",
            borderColor: "#6bd098",
            backgroundColor: "#6bd098",
            data: refuseData,
            fill: false,
            tension: 0.4,
            borderWidth: 3,
          },
          {
            label: "Wood",
            borderColor: "#f17e5d",
            backgroundColor: "#f17e5d",
            data: woodData,
            fill: false,
            tension: 0.4,
            borderWidth: 3,
          },
        ],
      });
    } catch (error) {
      console.error("Error loading line chart data:", error);
    }
  }

  loadLineChartDatatwo();
}, []);





  return (
    <>
      <div className="content">
        <Row>
          <Col lg="3" md="6" sm="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-globe text-warning" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Today's Generation</p>
                      <CardTitle tag="p">150kW</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="far fa-calendar" /> EDIT Today's Date
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-bulb-63 text-success" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Most Energy From</p>
                      <CardTitle tag="p">Natural Gas</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="far fa-calendar" /> Last Month
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-vector text-danger" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Sources of Energy</p>
                      <CardTitle tag="p">11</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="far fa-clock" /> In the last day
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-favourite-28 text-primary" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Cleanest Generation</p>
                      <CardTitle tag="p">In 3 hours</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="fas fa-sync-alt" /> Update now
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
          <Card >
            <CardHeader>
             <CardTitle tag="h5">Generation Prediction</CardTitle>
                <p className="card-category">24 Hours Forecast (MW)</p>
              </CardHeader>
              <CardBody>
              {lineChartDataone.labels.length > 0 ? (
                <Line
                  id="lineChart"
                  data={lineChartDataone}
                  options={predictiongraph.options}
                  width={600}
                  length={100}
                />
              ) : (
                <p>Loading line chart data...</p>
              )}
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                <i className="fa fa-history" /> Updated from CSV
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="4">
            <Card>
              <CardHeader>
                <CardTitle tag="h5">Generation Breakdown</CardTitle>
                <p className="card-category">Last Year's Performance (MW)</p>
              </CardHeader>
              <CardBody style={{ height: "430px" }}>
              {pieChartData.labels.length > 0 ? (
                <Pie id="pieChart" data={pieChartData} />
              ) : (
                <p>Loading pie chart data...</p>
              )}
              </CardBody> 
              <CardFooter>
                <div className="stats">
                  <i i className="fa fa-history" /> Updated from CSV
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col md="8">
            <Card className="card-chart">
              <CardHeader>
                <CardTitle tag="h5">Generation Prediction</CardTitle>
                <p className="card-category">24 Hour Forecast (MW)</p>
              </CardHeader>
              <CardBody>
              {lineChartDatatwo.labels.length > 0 ? (
                <Line
                  id="lineChart"
                  data={lineChartDatatwo}
                  options={predictiongraph.options}
                  height = "129px"
                />
              ) : (
                <p>Loading line chart data...</p>
              )}
              </CardBody>
              <CardFooter>

                <hr />
                <div className="card-stats">
                  <i i className="fa fa-history" /> Updated from CSV
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Dashboard;

