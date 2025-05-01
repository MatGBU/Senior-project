// chartData.js
import { Chart, Legend, LineElement, CategoryScale, LinearScale, PointElement, Tooltip } from "chart.js";

// 1️⃣ Register the plugins we need
Chart.register(Legend, LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

// 2️⃣ Fetch your 48 hr forecast CSV (only whole hours)
export async function fetchForecastCSV() {
  const resp = await fetch("/data/energy_predictions.csv");
  const text = await resp.text();
  const rows = text.trim().split("\n").map(r => r.split(","));
  const [hdr, ...body] = rows;
  // Only keep rows at exact whole hour (minute=0)
  const hourly = body.filter(r => r.length === hdr.length).filter(r => {
    const d = new Date(r[0]);
    return d.getUTCMinutes() === 0;
  });

  return {
    labels:      hourly.map(r => r[0]),
    hydroData:   hourly.map(r => +r[1] || 0),
    nuclearData: hourly.map(r => +r[2] || 0),
    windData:    hourly.map(r => +r[3] || 0),
    solarData:   hourly.map(r => +r[4] || 0),
  };
}

// 3️⃣ Build and export both `data` & `options` for your chart
export async function predictiongraph() {
  // forecast
  const { labels, hydroData, nuclearData, windData, solarData } = await fetchForecastCSV();

  // real-time ISO fetch
  const respISO = await fetch("/data/realtime_iso.csv");
  const textISO = await respISO.text();
  const rowsISO = textISO.trim().split("\n").map(r => r.split(","));
  const [hdrISO, ...bodyISO] = rowsISO;
  const isoTechs = hdrISO.slice(1).filter(tech => !/total_predicted/i.test(tech));

  // Forecast datasets
  const forecastSets = [
    {
      label: "Hydro",
      data: hydroData,
      borderColor: "#6bd098",
      backgroundColor: "#6bd098",
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 0,
    },
    {
      label: "Nuclear",
      data: nuclearData,
      borderColor: "#f17e5d",
      backgroundColor: "#f17e5d",
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 0,
    },
    {
      label: "Wind",
      data: windData,
      borderColor: "#fcc468",
      backgroundColor: "#fcc468",
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 0,
    },
    {
      label: "Solar",
      data: solarData,
      borderColor: "#1f8ef1",
      backgroundColor: "#1f8ef1",
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 0,
    },
  ];

  // Filter ISO rows to whole hours
  const isoRowsHourly = bodyISO.filter(r => {
    const d = new Date(r[0]);
    return d.getUTCMinutes() === 0;
  });

  // ISO datasets
  const isoSets = isoTechs.map(tech => {
    const idx = hdrISO.indexOf(tech);
    const simple = tech.replace(/Predictions$/i, "");
    return {
      label: `ISO ${simple}`,
      data: labels.map((ts, i) => {
        // map hourly forecast timestamps to isoRowsHourly by same index
        return isoRowsHourly[i] && parseFloat(isoRowsHourly[i][idx + 1]) || null;
      }),
      borderColor:
        simple === "Hydro"   ? "#6bd098" :
        simple === "Nuclear" ? "#f17e5d" :
        simple === "Wind"    ? "#fcc468" :
        simple === "Solar"   ? "#1f8ef1" :
        "#888888",
      backgroundColor: "transparent",
      fill: false,
      tension: 0.4,
      borderWidth: 2,
      borderDash: [5, 5],
      spanGaps: false,
      hidden: true,
    };
  });

  // Chart options (category x-axis)
  const options = {
    scales: {
      x: {
        type: 'category',
        title: { display: true, text: 'Time (UTC)' }
      },
      y: { title: { display: true, text: 'MW' } }
    },
    plugins: {
      legend: {
        display: true
      }
    },
    maintainAspectRatio: true,
    aspectRatio: 3,
  };

  return {
    data: {
      labels,
      datasets: [...forecastSets, ...isoSets]
    },
    options,
  };
}
