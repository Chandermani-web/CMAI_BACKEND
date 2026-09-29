import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";

import authRouter from "./src/routes/auth.route.js";
import billingRouter from "./src/routes/billing.route.js";
import interviewRouter from "./src/routes/interview.route.js";
import resumeRouter from "./src/routes/resume.route.js";
import roadmapRouter from "./src/routes/roadmap.route.js";

import { isAuth } from "./src/middleware/isAuth.js";
import { getCurrentUser } from "./src/controllers/auth.controller.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "25mb",
  })
);

app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "cmai-backend",
  });
});

app.get("/api/me", isAuth, getCurrentUser);

app.use("/api/auth", authRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/roadmap", roadmapRouter);
app.use("/api/billing", billingRouter);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`CM.AI backend running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();