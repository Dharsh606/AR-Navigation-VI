/**
 * AR-NAV-VI Backend – sessions, emergency, heatmaps.
 * Run: npm install && npm start
 */

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const sessions = [];
const heatmap = [];
const emergencies = [];

app.post("/api/sessions", (req, res) => {
  sessions.push({ ...req.body, id: sessions.length + 1, at: new Date().toISOString() });
  res.json({ ok: true });
});

app.post("/api/heatmap", (req, res) => {
  heatmap.push({ ...req.body, at: new Date().toISOString() });
  res.json({ ok: true });
});

app.post("/api/emergency", (req, res) => {
  emergencies.push({ ...req.body, at: new Date().toISOString() });
  console.log("EMERGENCY:", req.body);
  res.json({ ok: true });
});

app.get("/api/routes/frequent", (req, res) => {
  res.json({ routes: [] });
});

app.get("/api/risk-zones", (req, res) => {
  res.json({ zones: [] });
});

app.get("/api/analytics/summary", (req, res) => {
  res.json({
    sessionsCount: sessions.length,
    heatmapPoints: heatmap.length,
    emergenciesCount: emergencies.length,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("AR-NAV-VI backend: http://localhost:" + PORT));
