import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { changePasswordSchema } from "../validators/auth.validator";
import * as UserController from "../controllers/user.controller";

const router = Router();

router.get(
	"/my-user",
	authMiddleware,
	requirePermission("can_get_my_user"),
	UserController.getMyUser
);
router.patch(
	"/my-user/password",
	authMiddleware,
	requirePermission("can_post_login"),
	validateRequest(changePasswordSchema),
	UserController.changePassword
);
router.get(
	"/users",
	authMiddleware,
	requirePermission("can_get_users"),
	UserController.listUsers
);

export default router;
