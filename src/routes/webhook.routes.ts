import { Router } from "express";
import { handleOrderCreated } from "../controllers/webhook.controller";

const router = Router();

router.use((req, res, next) => {
	let data = "";
	req.setEncoding("utf8");

	req.on("data", (chunk) => {
		data += chunk;
	});

	req.on("end", () => {
		(req as any).rawBody = data;

		try {
			req.body = JSON.parse(data);
		} catch (e) {
			req.body = {};
		}

		next();
	});
});

router.post("/shopify-sales", handleOrderCreated);

export default router;
