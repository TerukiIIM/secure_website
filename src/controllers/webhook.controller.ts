import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import { verifyShopifyWebhook } from "../utils/shopify";
import { logger } from "../utils/logger";

interface ShopifyLineItem {
	product_id: number;
	variant_id: number;
	quantity: number;
	price: string;
	title: string;
}

interface ShopifyOrderWebhook {
	id: number;
	line_items: ShopifyLineItem[];
	total_price: string;
	created_at: string;
}

export async function handleOrderCreated(req: Request, res: Response) {
	try {
		const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;

		if (!hmacHeader) {
			logger.warn("Webhook received without HMAC header");
			return res.status(401).json({ error: "Missing HMAC signature" });
		}

		const rawBody = (req as any).rawBody;

		if (!rawBody) {
			logger.error("Raw body not available for HMAC verification");
			return res.status(400).json({ error: "Invalid request format" });
		}

		const isValid = verifyShopifyWebhook(rawBody, hmacHeader);

		if (!isValid) {
			logger.warn("Invalid webhook signature");
			return res.status(401).json({ error: "Invalid signature" });
		}

		const order: ShopifyOrderWebhook = req.body;

		logger.info(`Processing order webhook: ${order.id}`);

		for (const item of order.line_items) {
			const shopifyProductId = item.product_id.toString();
			const quantity = item.quantity;

			const { data: product, error: fetchError } = await supabase
				.from("products")
				.select("id, sales_count, name")
				.eq("shopify_id", shopifyProductId)
				.single();

			if (fetchError || !product) {
				logger.warn(`Product not found for Shopify ID: ${shopifyProductId}`);
				continue;
			}

			const newSalesCount = (product.sales_count || 0) + quantity;

			const { error: updateError } = await supabase
				.from("products")
				.update({ sales_count: newSalesCount })
				.eq("id", product.id);

			if (updateError) {
				logger.error(
					`Failed to update sales_count for product ${product.id}:`,
					updateError
				);
			} else {
				logger.info(
					`Updated product ${product.name} (${product.id}): sales_count = ${newSalesCount}`
				);
			}
		}

		return res.status(200).json({ success: true });
	} catch (error) {
		logger.error("Error processing webhook:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
