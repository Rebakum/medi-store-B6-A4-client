import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { notFound } from "./middleware/notFound";





const app: Application = express();

// CORS with credentials
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
  })
);

//  cookie parser MUST
app.use(cookieParser());

app.use(express.json());


// MAIN ROUTE
app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("Server running successfully");
});

app.use(notFound);


export default app;
