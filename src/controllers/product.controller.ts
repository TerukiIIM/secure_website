import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { supabase } from "../db/supabase";

async function shopifyCreateProduct(
	storeDomain: string,
	adminToken: string,
	name: string,
	price: number,
	imageUrl?: string
) {
	const url = `https://${storeDomain}/admin/api/2025-10/products.json`;

	const productBody: any = {
		title: name,
		variants: [{ price: price.toFixed(2) }],
	};

	if (imageUrl) {
		productBody.images = [{ src: imageUrl }];
	}

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Shopify-Access-Token": adminToken,
		},
		body: JSON.stringify({ product: productBody }),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Shopify API error (${res.status}): ${text}`);
	}

	const data: any = await res.json();
	const productId = data?.product?.id;
	const productTitle = data?.product?.title;
	const priceSet = data?.product?.variants?.[0]?.price;
	if (!productId) throw new Error("Missing product id from Shopify response");
	return { productId, productTitle, price: Number(priceSet ?? price) };
}

export async function createProduct(req: AuthRequest, res: Response) {
	try {
		const user = req.user;
		const { name, price, image_url } = req.body as {
			name: string;
			price: number;
			image_url?: string;
		};

		if (image_url && !user?.role?.can_upload_images) {
			return res.status(403).json({
				error:
					"Permission denied: Image upload requires PREMIUM role or higher",
			});
		}

		const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
		const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

		let productId: string;
		let productTitle: string;
		let savedPrice: number;
		let isMock = false;

		if (!storeDomain || !adminToken) {
			console.warn(
				"[MOCK MODE] Creating product without Shopify API (no credentials)"
			);
			productId = `mock_${Date.now()}_${Math.random()
				.toString(36)
				.substring(7)}`;
			productTitle = name;
			savedPrice = price;
			isMock = true;
		} else {
			const shopifyResult = await shopifyCreateProduct(
				storeDomain,
				adminToken,
				name,
				price,
				image_url
			);
			productId = String(shopifyResult.productId);
			productTitle = shopifyResult.productTitle;
			savedPrice = shopifyResult.price;
		}

		const { data, error } = await supabase
			.from("products")
			.insert([
				{
					shopify_id: productId,
					name: productTitle,
					price: savedPrice,
					image_url: image_url || null,
					created_by: user.id,
				},
			])
			.select("id, shopify_id, name, price, image_url, created_by, created_at")
			.single();

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		return res.status(201).json({
			product: data,
			...(isMock && {
				mock: true,
				message: "Product created in DB only (Shopify mock mode)",
			}),
		});
	} catch (err: any) {
		return res
			.status(500)
			.json({ error: "Failed to create product", details: err.message });
	}
}

export async function getMyProducts(req: AuthRequest, res: Response) {
	try {
		const user = req.user;
		const { data, error } = await supabase
			.from("products")
			.select(
				"id, shopify_id, name, price, sales_count, created_by, created_at"
			)
			.eq("created_by", user.id)
			.order("created_at", { ascending: false });

		if (error) return res.status(500).json({ error: error.message });
		return res.json({ products: data });
	} catch (err: any) {
		return res
			.status(500)
			.json({ error: "Failed to fetch products", details: err.message });
	}
}

export async function getAllProducts(req: AuthRequest, res: Response) {
	try {
		const { data, error } = await supabase
			.from("products")
			.select(
				"id, shopify_id, name, price, sales_count, created_by, created_at"
			)
			.order("created_at", { ascending: false });

		if (error) return res.status(500).json({ error: error.message });
		return res.json({ products: data, count: data?.length ?? 0 });
	} catch (err: any) {
		return res
			.status(500)
			.json({ error: "Failed to fetch products", details: err.message });
	}
}

export async function getMyBestsellers(req: AuthRequest, res: Response) {
	try {
		const user = req.user;

		const { data, error } = await supabase
			.from("products")
			.select("id, shopify_id, name, price, sales_count, image_url, created_at")
			.eq("created_by", user.id)
			.order("sales_count", { ascending: false })
			.order("created_at", { ascending: false });

		if (error) return res.status(500).json({ error: error.message });

		return res.json({
			bestsellers: data,
			count: data?.length ?? 0,
		});
	} catch (err: any) {
		return res
			.status(500)
			.json({ error: "Failed to fetch bestsellers", details: err.message });
	}
}

export async function addSale(req: AuthRequest, res: Response) {
	try {
		const user = req.user;
		const { id } = req.params;
		const { quantity } = req.body;

		const qty = quantity && Number(quantity) > 0 ? Number(quantity) : 1;

		const { data: product, error: fetchError } = await supabase
			.from("products")
			.select("id, name, sales_count, created_by")
			.eq("id", id)
			.single();

		if (fetchError || !product) {
			return res.status(404).json({ error: "Product not found" });
		}

		if (product.created_by !== user.id) {
			return res
				.status(403)
				.json({ error: "You can only add sales to your own products" });
		}

		const { data: updated, error: updateError } = await supabase
			.from("products")
			.update({ sales_count: product.sales_count + qty })
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			return res.status(500).json({ error: updateError.message });
		}

		return res.json({
			success: true,
			message: `Added ${qty} sale(s) to product "${product.name}"`,
			product: updated,
		});
	} catch (err: any) {
		return res
			.status(500)
			.json({ error: "Failed to add sale", details: err.message });
	}
}
