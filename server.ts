import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";

const app = express();
const PORT = 3000;

// Simple JSON-based database for persistence
const DB_PATH = path.join(process.cwd(), "db.json");

async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({
      patients: [],
      appointments: [],
      prescriptions: [],
      payments: [],
      users: []
    }, null, 2));
  }
}

async function getDB() {
  const data = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(data);
}

async function saveDB(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development with Vite
}));
app.use(express.json());

// API Routes
app.get("/api/stats", async (req, res) => {
  const db = await getDB();
  res.json({
    patients: db.patients.length,
    appointments: db.appointments.length,
    revenue: db.payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0),
    prescriptions: db.prescriptions.length
  });
});

app.get("/api/patients", async (req, res) => {
  const db = await getDB();
  res.json(db.patients);
});

app.post("/api/patients", async (req, res) => {
  const db = await getDB();
  const newPatient = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  db.patients.push(newPatient);
  await saveDB(db);
  res.status(201).json(newPatient);
});

app.get("/api/appointments", async (req, res) => {
  const db = await getDB();
  res.json(db.appointments);
});

app.post("/api/appointments", async (req, res) => {
  const db = await getDB();
  const newAppointment = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  db.appointments.push(newAppointment);
  await saveDB(db);
  res.status(201).json(newAppointment);
});

app.get("/api/prescriptions", async (req, res) => {
  const db = await getDB();
  res.json(db.prescriptions);
});

app.post("/api/prescriptions", async (req, res) => {
  const db = await getDB();
  const newPrescription = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  db.prescriptions.push(newPrescription);
  await saveDB(db);
  res.status(201).json(newPrescription);
});

app.get("/api/payments", async (req, res) => {
  const db = await getDB();
  res.json(db.payments);
});

app.post("/api/payments", async (req, res) => {
  const db = await getDB();
  const newPayment = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  db.payments.push(newPayment);
  await saveDB(db);
  res.status(201).json(newPayment);
});

async function startServer() {
  await initDB();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
