import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createApiKeySchema } from "../validators/apiKey.validator";
import {
	createApiKey,
	listMyApiKeys,
	deleteApiKey,
} from "../controllers/apiKey.controller";

const router = Router();

router.post(
	"/",
	authMiddleware,
	validateRequest(createApiKeySchema),
	createApiKey
);
router.get("/", authMiddleware, listMyApiKeys);
router.delete("/:id", authMiddleware, deleteApiKey);

export default router;
