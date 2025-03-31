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

  // New state for Cleanest Generation info
  // It will store an object: { day, bestTime, generation, subsequentRows }
  const [cleanestGeneration, setCleanestGeneration] = useState(null);

  // Fetch data for the first Line Chart
  useEffect(() => {
    async function loadLineChartDataone() {
      try {
        const response = await fetch("/data/energy_predictions.csv");
        const csvText = await response.text();
  
        // Parse the CSV assuming first row as header
        const rows = csvText.split("\n").map((row) => row.split(","));
        const headers = rows[0];
        const dataRows = rows.slice(1).filter((row) => row.length === headers.length);
  
        const labels = dataRows.map((row) => row[0]); // Dates as labels
        const hydroData = dataRows.map((row) => parseFloat(row[2]) || 0); // Hydro
        const nuclearData = dataRows.map((row) => parseFloat(row[3]) || 0); // Nuclear
        const windData = dataRows.map((row) => parseFloat(row[4]) || 0); // Wind
        const solarData = dataRows.map((row) => parseFloat(row[5]) || 0); // Solar
        
        // NEW: Combine Refuse (col 5) + Wood (col 6)
        const otherData = dataRows.map((row) => {
          const refuseVal = parseFloat(row[6]) || 0;
          const woodVal = parseFloat(row[7]) || 0;
          return refuseVal + woodVal;
        });
  
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
            // NEW DATASET for Refuse+Wood
            {
              label: "Other Renewables",
              borderColor: "#9C27B0",
              backgroundColor: "#9C27B0",
              data: otherData,
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
      if (rows.length < 2) {
        console.warn("CSV has no data for the second chart.");
        return;
      }

      const headers = rows[0];
      // Filter out rows that don't match the header length or have an empty date
      const dataRows = rows.slice(1).filter(
        (row) => row.length === headers.length && row[0].trim() !== ""
      );

      const labels = [];
      const renewPercentData = [];
      const nonRenewPercentData = [];

      // For each row, calculate Renewables% vs. Non-Renewables%
      dataRows.forEach((row) => {
        const dateTime = row[0]; // BeginDate
        labels.push(dateTime);

        const total = parseFloat(row[1]) || 0;  // Total_Predicted

        // Sum of renewables = Hydro + Nuclear + Wind + Solar + Refuse + Wood
        const hydro = parseFloat(row[2]) || 0;
        const nuclear = parseFloat(row[3]) || 0;
        const wind = parseFloat(row[4]) || 0;
        const solar = parseFloat(row[5]) || 0;
        const refuse = parseFloat(row[6]) || 0;
        const wood = parseFloat(row[7]) || 0;

        const renewables = hydro + nuclear + wind + solar + refuse + wood;
        const nonRenewables = total - renewables;

        if (total === 0) {
          // Avoid divide-by-zero
          renewPercentData.push(0);
          nonRenewPercentData.push(0);
        } else {
          renewPercentData.push((renewables / total) * 100);
          nonRenewPercentData.push((nonRenewables / total) * 100);
        }
      });

      // Now set the data for the second line chart
      setLineChartDatatwo({
        labels: labels,
        datasets: [
          {
            label: "Renewables (%)",
            data: renewPercentData,
            borderColor: "#6bd098",
            backgroundColor: "#6bd098",
            fill: false,
            tension: 0.4,
            borderWidth: 3,
          },
          {
            label: "Non-Renewables (%)",
            data: nonRenewPercentData,
            borderColor: "#f17e5d",
            backgroundColor: "#f17e5d",
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


  // New useEffect to calculate Cleanest Generation for the day and subsequent hours
useEffect(() => {
  async function loadCleanestGeneration() {
    try {
      const response = await fetch("/data/energy_predictions.csv");
      const csvText = await response.text();

      // Parse CSV: assumes first row is header
      const rows = csvText.split("\n").map((row) => row.split(","));
      const headers = rows[0];
      const dataRows = rows.slice(1).filter(
        (row) => row.length === headers.length && row[0].trim() !== ""
      );

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Filter rows to only include today's date
      const todayRows = dataRows.filter((row) => row[0].startsWith(today));

      if (todayRows.length === 0) {
        console.warn("No data available for today:", today);
        setCleanestGeneration(null);
        return;
      }

      // Find the row with the highest "clean" generation (Hydro + Nuclear + Wind + Solar)
      let bestIndex = -1;
      let bestGeneration = -Infinity;
      todayRows.forEach((row, idx) => {
        const hydro = parseFloat(row[2]) || 0;
        const nuclear = parseFloat(row[3]) || 0;
        const wind = parseFloat(row[4]) || 0;
        const solar = parseFloat(row[5]) || 0;
        const total = hydro + nuclear + wind + solar;

        if (total > bestGeneration) {
          bestGeneration = total;
          bestIndex = idx;
        }
      });

      // Get best row and subsequent data for visualization
      const bestRow = todayRows[bestIndex] || [];
      const bestTime = bestRow[0].split(" ")[1] || "Unknown Time";

      setCleanestGeneration({
        day: today,
        bestTime: bestTime,
        generation: bestGeneration,
        bestIndex: bestIndex,
      });
    } catch (error) {
      console.error("Error loading cleanest generation data:", error);
    }
  }

  loadCleanestGeneration();
}, []);

const [todaysGeneration, setTodaysGeneration] = useState(0);

useEffect(() => {
  async function loadTodaysGeneration() {
    try {
      const response = await fetch("/data/energy_predictions.csv");
      const csvText = await response.text();

      // Parse CSV
      const rows = csvText.split("\n").map((row) => row.split(","));
      const headers = rows[0];
      const dataRows = rows.slice(1).filter((row) => row.length === headers.length);

      // Get today's date in "YYYY-MM-DD" format
      const today = new Date().toISOString().split("T")[0];

      // Find the row that matches today's date
      const todayRow = dataRows.find((row) => row[0].startsWith(today));

      if (todayRow) {
        const hydro = parseFloat(todayRow[2]) || 0;
        const nuclear = parseFloat(todayRow[3]) || 0;
        const wind = parseFloat(todayRow[4]) || 0;
        const solar = parseFloat(todayRow[5]) || 0;

        // Sum renewable + nuclear generation
        const totalCleanGeneration = hydro + nuclear + wind + solar;
        setTodaysGeneration(totalCleanGeneration);
      }
    } catch (error) {
      console.error("Error loading today's generation:", error);
    }
  }

  loadTodaysGeneration();
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
            <p className="card-category">Peak Supply</p>
            <CardTitle tag="p">{todaysGeneration.toFixed(2)} MW</CardTitle>
            <p />
          </div>
        </Col>
      </Row>
    </CardBody>
    <CardFooter>
      <hr />
      <div className="stats">
        <i className="far fa-calendar" /> Updated for Today
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
                      {cleanestGeneration ? (
                        <CardTitle tag="p">
                          {cleanestGeneration.bestTime}
                        </CardTitle>
                      ) : (
                        <CardTitle tag="p">Loading...</CardTitle>
                      )}
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="far fa-calendar" /> Updated for Today
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <Card>
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
                  <i className="fa fa-history" /> Updated from CSV
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
                    height="129px"
                  />
                ) : (
                  <p>Loading line chart data...</p>
                )}
              </CardBody>
              <CardFooter>
                <hr />
                <div className="card-stats">
                  <i className="fa fa-history" /> Updated from CSV
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
