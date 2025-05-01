// src/components/Dashboard.js

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
  Button,
} from "reactstrap";

// core components
import { predictiongraph } from "../variables/charts.js";


function Dashboard() {
  // ——— CHART STATES ———
  const [lineChartDataone, setLineChartDataone] = useState({ labels: [], datasets: [] });
  const [pieChartData, setPieChartData]       = useState({ labels: [], datasets: [] });
  const [lineChartDatatwo, setLineChartDatatwo]= useState({ labels: [], datasets: [] });

  // ——— EXTRA STATS ———
  const [cleanestGeneration, setCleanestGeneration] = useState(null);
  const [todaysGeneration, setTodaysGeneration]     = useState(0);

  // ——— ISO TOGGLE ———
  const [showAllISO, setShowAllISO] = useState(false);

  // 1️⃣ Load Forecast + Real-time ISO for Chart #1
  useEffect(() => {
    async function loadLineChartDataone() {
      try {
        // Forecast CSV
        const respPred = await fetch("/data/energy_predictions.csv");
        const textPred = await respPred.text();
        const rowsPred = textPred.trim().split("\n").map(r => r.split(","));
        const [hdrPred, ...bodyPred] = rowsPred;
        const dataRows = bodyPred.filter(r => r.length === hdrPred.length);

        const labels      = dataRows.map(r => r[0]);
        const hydroData   = dataRows.map(r => +r[2] || 0);
        const nuclearData = dataRows.map(r => +r[3] || 0);
        const windData    = dataRows.map(r => +r[4] || 0);
        const solarData   = dataRows.map(r => +r[5] || 0);
        const otherData   = dataRows.map(r => (+r[6] || 0) + (+r[7] || 0));

        // Real-time ISO CSV
        const respISO = await fetch("/data/realtime_iso.csv");
        const textISO = await respISO.text();
        const rowsISO = textISO.trim().split("\n").map(r => r.split(","));
        const [hdrISO, ...bodyISO] = rowsISO;
        const isoTechs = hdrISO.slice(1).filter(t => !/total_predicted/i.test(t));

        // Build lookup map
        const isoMap = {};
        isoTechs.forEach(t => isoMap[t] = {});
        bodyISO
          .filter(r => r.length === hdrISO.length)
          .forEach(r => {
            const ts = r[0];
            isoTechs.forEach(tech => {
              const idx = hdrISO.indexOf(tech);
              isoMap[tech][ts] = parseFloat(r[idx]) || 0;
            });
          });

        // Create ISO datasets
        const isoDatasets = isoTechs.map(tech => {
          const simpleName = tech.replace(/Predictions$/i, "");
          return {
            label: `Real-time ${simpleName}`,
            data: labels.map(ts => isoMap[tech][ts] != null ? isoMap[tech][ts] : null),
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            spanGaps: false,
            borderDash: [5, 5],
            borderColor:
              simpleName === "Hydro"   ? "#6bd098" :
              simpleName === "Nuclear" ? "#f17e5d" :
              simpleName === "Wind"    ? "#fcc468" :
              simpleName === "Solar"   ? "#1f8ef1" :
              "#888888",
            backgroundColor: "transparent",
            hidden: !showAllISO,
          };
        });

        setLineChartDataone({
          labels,
          datasets: [
            { label: "Hydro",    data: hydroData,   borderColor: "#6bd098", fill: false, tension: 0.4, borderWidth: 3 },
            { label: "Nuclear",  data: nuclearData, borderColor: "#f17e5d", fill: false, tension: 0.4, borderWidth: 3 },
            { label: "Wind",     data: windData,    borderColor: "#fcc468", fill: false, tension: 0.4, borderWidth: 3 },
            { label: "Solar",    data: solarData,   borderColor: "#1f8ef1", fill: false, tension: 0.4, borderWidth: 3 },
            { label: "Other Renewables", data: otherData, borderColor: "#9C27B0", fill: false, tension: 0.4, borderWidth: 3 },
            ...isoDatasets,
          ],
        });
      } catch (error) {
        console.error("Error loading line chart data:", error);
      }
    }
    loadLineChartDataone();
  }, [showAllISO]);

  // Helper to toggle a single dataset
  const toggleDataset = label => {
    setLineChartDataone(prev => ({
      ...prev,
      datasets: prev.datasets.map(ds =>
        ds.label === label ? { ...ds, hidden: !ds.hidden } : ds
      ),
    }));
  };

  // Split datasets for custom legend
  const forecastSets = lineChartDataone.datasets.filter(ds => !ds.label.startsWith("Real-time "));
  const realtimeSets = lineChartDataone.datasets.filter(ds => ds.label.startsWith("Real-time "));

  // 3️⃣ Load Pie Chart
  useEffect(() => {
    async function loadPieChartData() {
      try {
        const response = await fetch("/data/TwoYear_Training_Set_Copy.csv");
        const csvText  = await response.text();
        const rows     = csvText.split("\n").map(r => r.split(","));
        const headers  = rows[0];
        const dataRows = rows.slice(1).filter(r => r.length === headers.length);

        const techLabels = headers.slice(1, 12);
        const techTotals = techLabels.map((_, i) =>
          dataRows.reduce((sum, r) => sum + parseFloat(r[i + 1] || 0), 0)
        );

        setPieChartData({
          labels: techLabels,
          datasets: [{
            label: "Total Generation",
            data: techTotals,
            backgroundColor: ["#FF6384","#36A2EB","#FFCE56","#8BC34A","#FF5722","#9C27B0"]
          }],
        });
      } catch (error) {
        console.error(error);
      }
    }
    loadPieChartData();
  }, []);

  // 4️⃣ Load 2nd Line Chart (Renew% vs Non-Renew%)
  useEffect(() => {
    async function loadLineChartDatatwo() {
      try {
        const response = await fetch("/data/energy_predictions.csv");
        const csvText  = await response.text();
        const rows     = csvText.split("\n").map(r => r.split(","));
        const headers  = rows[0];
        const dataRows = rows.slice(1).filter(r => r.length === headers.length && r[0].trim());

        const labels = [], renewP = [], nonP = [];
        dataRows.forEach(r => {
          labels.push(r[0]);
          const total     = +r[1] || 0;
          const renewable = [+r[2],+r[3],+r[4],+r[5],+r[6],+r[7]].reduce((a,b)=>a+b,0);
          renewP.push(total ? (renewable/total)*100 : 0);
          nonP.push(total ? ((total-renewable)/total)*100 : 0);
        });

        setLineChartDatatwo({
          labels,
          datasets: [
            { label: "Renewables (%)",     data: renewP, borderColor: "#6bd098", fill: false, tension: 0.4, borderWidth: 3 },
            { label: "Non-Renewables (%)", data: nonP,   borderColor: "#f17e5d", fill: false, tension: 0.4, borderWidth: 3 },
          ],
        });
      } catch(e) {
        console.error(e);
      }
    }
    loadLineChartDatatwo();
  }, []);

  // 5️⃣ Cleanest Generation of Today
  useEffect(() => {
    async function loadCleanestGeneration() {
      try {
        const resp = await fetch("/data/energy_predictions.csv");
        const text = await resp.text();
        const rows = text.split("\n").map(r => r.split(","));
        const headers = rows[0];
        const dataRows= rows.slice(1).filter(r => r.length === headers.length && r[0].trim());

        const today     = new Date().toISOString().slice(0,10);
        const todayRows = dataRows.filter(r => r[0].startsWith(today));
        if (!todayRows.length) return setCleanestGeneration(null);

        let bestGen=-Infinity, bestTime="Unknown";
        todayRows.forEach(r => {
          const sum=[+r[2],+r[3],+r[4],+r[5]].reduce((a,b)=>a+b,0);
          if(sum>bestGen){ bestGen=sum; bestTime=r[0].split(" ")[1]; }
        });
        setCleanestGeneration({ day: today, bestTime, generation: bestGen });
      } catch(e) {
        console.error(e);
      }
    }
    loadCleanestGeneration();
  }, []);

  // 6️⃣ Today's Total Clean Generation
  useEffect(() => {
    async function loadTodaysGeneration() {
      try {
        const resp = await fetch("/data/energy_predictions.csv");
        const text = await resp.text();
        const rows = text.split("\n").map(r => r.split(","));
        const headers = rows[0];
        const dataRows= rows.slice(1).filter(r => r.length === headers.length);

        const today = new Date().toISOString().slice(0,10);
        const row   = dataRows.find(r => r[0].startsWith(today));
        if (row) {
          const sum = [+row[2],+row[3],+row[4],+row[5],+row[6],+row[7]].reduce((a,b)=>a+b,0);
          setTodaysGeneration(sum);
        }
      } catch(e) {
        console.error(e);
      }
    }
    loadTodaysGeneration();
  }, []);

  return (
    <div className="content">
      {/* ——— Top Stats Cards ——— */}
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
                      <CardTitle tag="p">{cleanestGeneration.bestTime}</CardTitle>
                    ) : (
                      <CardTitle tag="p">Loading…</CardTitle>
                    )}
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

      {/* ——— First Line Chart ——— */}
      <Row>
        <Col lg="12">
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <CardTitle tag="h5">Generation Prediction</CardTitle>
                <p className="card-category">48-Hour Forecast (MW)</p>
              </div>
              <Button size="sm" onClick={() => {
                const anyVisible = realtimeSets.some(ds => !ds.hidden);
                setLineChartDataone(prev => ({
                  ...prev,
                  datasets: prev.datasets.map(ds =>
                    ds.label.startsWith("Real-time ")
                      ? { ...ds, hidden: anyVisible }
                      : ds
                  )
                }));
              }}>
                {realtimeSets.some(ds => !ds.hidden) ? "Hide Real-time" : "Show Real-time"}
              </Button>
            </CardHeader>
            <CardBody style={{ padding: "0.5rem" }}>
              {lineChartDataone.labels.length ? (
                <Line
                  data={lineChartDataone}
                  options={{
                    ...predictiongraph.options,
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: true,
                    aspectRatio: 3,
                  }}
                />
              ) : (
                <p>Loading…</p>
              )}
              {/* Custom two-row legend */}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  {forecastSets.map(ds => (
                    <div key={ds.label} onClick={() => toggleDataset(ds.label)} style={{
                      cursor: "pointer", display: "flex", alignItems: "center",
                      marginRight: "1rem", opacity: ds.hidden ? 0.4 : 1
                    }}>
                      <span style={{
                        width: 12, height: 12, backgroundColor: ds.borderColor,
                        marginRight: 4, display: "inline-block"
                      }} />
                      <span>{ds.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {realtimeSets.map(ds => (
                    <div key={ds.label} onClick={() => toggleDataset(ds.label)} style={{
                      cursor: "pointer", display: "flex", alignItems: "center",
                      marginRight: "1rem", opacity: ds.hidden ? 0.4 : 1
                    }}>
                      <span style={{
                        width: 12, height: 12, borderStyle: "dashed",
                        borderWidth: 2, borderColor: ds.borderColor,
                        marginRight: 4, display: "inline-block"
                      }} />
                      <span>{ds.label}</span>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* ——— Pie & Second Line Chart ——— */}
      <Row>
        <Col md="4">
          <Card>
            <CardHeader>
              <CardTitle tag="h5">Generation Breakdown</CardTitle>
              <p className="card-category">Last Year's Performance (MW)</p>
            </CardHeader>
            <CardBody style={{ height: "430px" }}>
              {pieChartData.labels.length ? (
                <Pie id="pieChart" data={pieChartData} />
              ) : (
                <p>Loading…</p>
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
              <p className="card-category">48 Hour Forecast (MW)</p>
            </CardHeader>
            <CardBody>
              {lineChartDatatwo.labels.length ? (
                <Line
                  id="lineChart"
                  data={lineChartDatatwo}
                  options={predictiongraph.options}
                  height="129px"
                />
              ) : (
                <p>Loading…</p>
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
  );
}

export default Dashboard;
