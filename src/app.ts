import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { notFound } from "./middleware/notFound";
import globalErrorHandler from "./middleware/globalErrorHandler";
import path from "path";
import config from "./config";

const app: Application = express();


app.use(
  cors({
    origin:config.frontend_url || "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", router);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.send("Server running successfully");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
