import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import { generateApiKey, hashApiKey } from "../utils/apiKey";
import { logger } from "../utils/logger";

export async function createApiKey(req: Request, res: Response) {
	try {
		const { name } = req.body;
		const userId = req.user!.id;

		const apiKey = generateApiKey();

		const keyHash = await hashApiKey(apiKey);

		const { data, error } = await supabase
			.from("api_keys")
			.insert({
				user_id: userId,
				name,
				key_hash: keyHash,
			})
			.select("id, name, created_at")
			.single();

		if (error) {
			logger.error("Failed to create API key:", error);
			return res.status(500).json({ error: "Failed to create API key" });
		}

		logger.info(`API key created: ${data.id} for user ${userId}`);

		return res.status(201).json({
			message: "API key created successfully",
			warning: "Save this key now. You will not be able to see it again.",
			api_key: apiKey,
			key_info: {
				id: data.id,
				name: data.name,
				created_at: data.created_at,
			},
		});
	} catch (error) {
		logger.error("Error creating API key:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}

export async function listMyApiKeys(req: Request, res: Response) {
	try {
		const userId = req.user!.id;

		const { data, error } = await supabase
			.from("api_keys")
			.select("id, name, created_at")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) {
			logger.error("Failed to list API keys:", error);
			return res.status(500).json({ error: "Failed to list API keys" });
		}

		return res.json({
			count: data.length,
			api_keys: data,
		});
	} catch (error) {
		logger.error("Error listing API keys:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}

export async function deleteApiKey(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const userId = req.user!.id;

		const { data: apiKey, error: fetchError } = await supabase
			.from("api_keys")
			.select("id, user_id")
			.eq("id", id)
			.single();

		if (fetchError || !apiKey) {
			return res.status(404).json({ error: "API key not found" });
		}

		if (apiKey.user_id !== userId) {
			return res.status(403).json({ error: "You do not own this API key" });
		}

		const { error: deleteError } = await supabase
			.from("api_keys")
			.delete()
			.eq("id", id);

		if (deleteError) {
			logger.error("Failed to delete API key:", deleteError);
			return res.status(500).json({ error: "Failed to delete API key" });
		}

		logger.info(`API key deleted: ${id} by user ${userId}`);

		return res.json({ message: "API key deleted successfully" });
	} catch (error) {
		logger.error("Error deleting API key:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
