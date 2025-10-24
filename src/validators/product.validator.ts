import { z } from "zod";

export const createProductSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters").max(200),
	price: z
		.number({ invalid_type_error: "Price must be a number" })
		.positive("Price must be positive"),
	image_url: z.string().url("Image must be a valid URL").optional(),
});
