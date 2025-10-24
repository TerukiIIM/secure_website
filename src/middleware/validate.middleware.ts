import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

export function validateRequest(schema: ZodSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			schema.parse(req.body);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				return res.status(400).json({
					error: "Validation failed",
					details: error.errors.map((e) => ({
						field: e.path.join("."),
						message: e.message,
					})),
				});
			}
			next(error);
		}
	};
}
