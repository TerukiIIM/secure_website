import crypto from "crypto";

export function verifyShopifyWebhook(
	body: Buffer | string,
	hmacHeader: string
): boolean {
	const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

	if (!secret) {
		console.error("SHOPIFY_WEBHOOK_SECRET not configured");
		return false;
	}

	const bodyString = typeof body === "string" ? body : body.toString("utf8");

	const hash = crypto
		.createHmac("sha256", secret)
		.update(bodyString, "utf8")
		.digest("base64");

	return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}
