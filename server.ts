import "./config/env.js";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { pool } from "./db/connection.js";
import whatsappRouter from "./whatsapp/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: [
      "https://www.planeat.life",
      "https://planeat.life",
      /^http:\/\/localhost:\d+$/,
    ],
    credentials: true,
  })
);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// WhatsApp routes
app.use("/", whatsappRouter);

// Serve landing page
app.use(express.static(path.join(__dirname, "landing/dist")));

// SPA fallback
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "landing/dist/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PlanEat server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  pool.end(() => {
    console.log("Database pool closed");
    process.exit(0);
  });
});

export default app;
