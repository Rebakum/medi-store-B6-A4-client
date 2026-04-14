import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { notFound } from "./middleware/notFound";
import globalErrorHandler from "./middleware/globalErrorHandler";
import path from "path";

const app: Application = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://medi-store-fontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman / server-to-server এ origin undefined হতে পারে
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", router);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.send("Server running successfully!");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
