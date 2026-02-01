
import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { notFound } from "./middleware/notFound";
import { ensureSuperAdmin } from "./seedAmin/ensureSuperAdmin";
import orderRouter from "./modules/order/order.route";
import globalErrorHandler from "./middleware/globalErrorHandler";
import path from "path";





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

ensureSuperAdmin();


// MAIN ROUTE



app.use("/api/v1", router);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


app.get("/", (req, res) => {
  res.send("Server running successfully");
});

app.use(notFound);
app.use(globalErrorHandler);


export default app;
