import { Request, Response, NextFunction } from "express";
import { supabase } from "../db/supabase";
import { verifyApiKey } from "../utils/apiKey";

export async function apiKeyAuth(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const apiKey = req.headers["x-api-key"] as string;

		if (!apiKey) {
			return res
				.status(401)
				.json({ error: "API key required in x-api-key header" });
		}

		const { data: apiKeys, error } = await supabase
			.from("api_keys")
			.select("id, key_hash, user_id");

		if (error) {
			throw error;
		}

		if (!apiKeys || apiKeys.length === 0) {
			return res.status(401).json({ error: "Invalid API key" });
		}

		let matchedKey = null;
		for (const key of apiKeys) {
			const isValid = await verifyApiKey(apiKey, key.key_hash);
			if (isValid) {
				matchedKey = key;
				break;
			}
		}

		if (!matchedKey) {
			return res.status(401).json({ error: "Invalid API key" });
		}

		const { data: user, error: userError } = await supabase
			.from("users")
			.select("id, name, email, role_id")
			.eq("id", matchedKey.user_id)
			.single();

		if (userError || !user) {
			return res.status(401).json({ error: "User not found for this API key" });
		}

		const { data: role, error: roleError } = await supabase
			.from("roles")
			.select("*")
			.eq("id", user.role_id)
			.single();

		if (roleError || !role) {
			return res.status(403).json({ error: "User role not found" });
		}

		req.user = {
			id: user.id,
			email: user.email,
			name: user.name,
			role_id: user.role_id,
			role: role,
		};

		next();
	} catch (error) {
		console.error("API Key authentication error:", error);
		return res.status(401).json({ error: "Invalid API key" });
	}
}

export async function combinedAuth(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const authHeader = req.headers.authorization;
	const apiKey = req.headers["x-api-key"] as string | undefined;
	if (
		authHeader &&
		authHeader.trim() &&
		authHeader.startsWith("Bearer ") &&
		authHeader.length > 7
	) {
		const { authMiddleware } = await import("./auth.middleware");
		return authMiddleware(req, res, next);
	}
	if (apiKey && apiKey.trim()) {
		return apiKeyAuth(req, res, next);
	}
	return res.status(401).json({
		error: "Authentication required",
		hint: "Provide either Authorization: Bearer <jwt> or x-api-key: <api_key> header",
	});
}
