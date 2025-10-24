import { Router } from "express";
import { combinedAuth } from "../middleware/apiKey.middleware";
import { requirePermission } from "../middleware/permission.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createProductSchema } from "../validators/product.validator";
import * as ProductController from "../controllers/product.controller";

const router = Router();

router.get("/my-products", combinedAuth, ProductController.getMyProducts);

router.get(
	"/my-bestsellers",
	combinedAuth,
	requirePermission("can_get_bestsellers"),
	ProductController.getMyBestsellers
);

router.post(
	"/products/:id/add-sale",
	combinedAuth,
	requirePermission("can_get_bestsellers"),
	ProductController.addSale
);

router.post(
	"/products",
	combinedAuth,
	requirePermission("can_post_products"),
	validateRequest(createProductSchema),
	ProductController.createProduct
);

router.get("/products", combinedAuth, ProductController.getAllProducts);

export default router;
