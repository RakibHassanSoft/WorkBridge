import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import routes from "@/routes";
import { errorHandler, notFoundHandler } from "@/middlewares/error.middleware";
import { globalLimiter } from "@/middlewares/rateLimit.middleware";

export function createApp(): Application {
  const app = express();

  // Behind a proxy/load balancer in production (correct client IPs for rate limiting).
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(globalLimiter);
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(","),
      credentials: true,
    })
  );
  // Trial uploads carry extracted text and (for images/PDFs) base64 the AI judge
  // looks at — far over express's 100kb default. Validators cap each field.
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BDFreshers server is running 🚀",
  });
});

  app.use("/api/v1", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);


  return app;
}
