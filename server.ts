import "./config/env";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { pool } from "./db/connection";
import whatsappRouter from "./whatsapp/routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use process.cwd() for landing path to work correctly with tsx
const projectRoot = process.cwd();

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

// Serve generated images
const imagesPath = path.join(projectRoot, "generated-images");
app.use("/images", express.static(imagesPath));

// Serve landing page
const landingPath = path.join(projectRoot, "landing/dist");
app.use(express.static(landingPath));

// SPA fallback
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(landingPath, "index.html"));
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
