import { z } from "zod";

export const createApiKeySchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must not exceed 50 characters")
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			"Name can only contain letters, numbers, spaces, dashes and underscores"
		),
});
