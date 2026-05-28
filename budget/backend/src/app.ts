import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { appSettingsRouter } from "./routes/appSettings.js";
import { authRouter } from "./routes/auth.js";
import { systemSettingsRouter } from "./routes/systemSettings.js";
import { categoriesRouter } from "./routes/categories.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { expensesRouter } from "./routes/expenses.js";
import { recurringRouter } from "./routes/recurring.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { errorHandler, HttpError } from "./middleware/httpError.js";
import { requireAuth } from "./middleware/requireAuth.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  const api = express.Router();
  api.use("/auth", authRouter);

  // Mount systemSettingsRouter. We'll handle requireAuth inside it for the PUT method.
  api.use("/system-settings", systemSettingsRouter);

  api.use(requireAuth);
  api.use("/app-settings", appSettingsRouter);
  api.use("/categories", categoriesRouter);
  api.use("/expenses", expensesRouter);
  api.use("/recurring-expenses", recurringRouter);
  api.use("/wishlist", wishlistRouter);
  api.use("/dashboard", dashboardRouter);
  app.use("/api", api);

  app.use((_req, _res, next) => {
    next(new HttpError(404, "Not found"));
  });
  app.use(errorHandler);

  return app;
}
