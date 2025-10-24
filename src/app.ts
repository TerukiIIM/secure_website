import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import apiKeyRoutes from "./routes/apiKey.routes";
import webhookRoutes from "./routes/webhook.routes";
import { errorHandler } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "*",
		credentials: true,
	})
);

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use("/webhooks", webhookRoutes);

app.use(express.json());

app.use((req, res, next) => {
	logger.info(`${req.method} ${req.path}`, {
		ip: req.ip,
		userAgent: req.get("user-agent"),
	});
	next();
});

app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", productRoutes);
app.use("/api-keys", apiKeyRoutes);

app.use(errorHandler);

export default app;
