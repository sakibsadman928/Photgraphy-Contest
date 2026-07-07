import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();

// Required on platforms that sit behind a reverse proxy (Render, Railway, Heroku, etc.)
// so that `secure` cookies and `req.protocol` behave correctly behind HTTPS termination.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check — used by most hosting platforms to verify the service is alive.
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
