// chartData.js
import { Chart } from 'chart.js';
// Fetch and parse CSV data
export async function fetchDataFromCSV() {
  const response = await fetch('http://localhost:8080/energy_predictions.csv');
  const data = await response.text();
  
  const labels = [];
  const hydroData = [];
  const nuclearData = [];
  const windData = [];
  const solarData = [];
  
  // Parse CSV data
  const rows = data.split('\n').slice(1); // Skip header row
  rows.forEach(row => {
      const cols = row.split(',');
      labels.push(cols[0]); // BeginDate
      hydroData.push(parseFloat(cols[1])); // HydroPredictions
      nuclearData.push(parseFloat(cols[2])); // NuclearPredictions
      windData.push(parseFloat(cols[3])); // WindPredictions
      solarData.push(parseFloat(cols[4])); // SolarPredictions
  });

  return { labels, hydroData, nuclearData, windData, solarData };
}

// Initialize and render the chart
export async function predictiongraph() {
  const { labels, hydroData, nuclearData, windData, solarData } = await fetchDataFromCSV();

  if (!labels || !hydroData || !nuclearData || !windData || !solarData) {
    console.error("Data is incomplete or undefined");
    return null; // Return null instead of breaking the app
  }

  return {
    labels: labels,
    datasets: [
      {
        label: "Hydro",
        borderColor: "#6bd098",
        backgroundColor: "#6bd098",
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        data: hydroData,
      },
      {
        label: "Nuclear",
        borderColor: "#f17e5d",
        backgroundColor: "#f17e5d",
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        data: nuclearData,
      },
      {
        label: "Wind",
        borderColor: "#fcc468",
        backgroundColor: "#fcc468",
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        data: windData,
      },
      {
        label: "Solar",
        borderColor: "#1f8ef1",
        backgroundColor: "#1f8ef1",
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        data: solarData,
      },
    ],
  };
}
