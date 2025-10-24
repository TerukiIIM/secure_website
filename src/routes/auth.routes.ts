import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

router.get("/health", (req, res) => res.json({ test: "hello world" }));
router.post(
	"/register",
	validateRequest(registerSchema),
	AuthController.register
);
router.post("/login", validateRequest(loginSchema), AuthController.login);

export default router;
