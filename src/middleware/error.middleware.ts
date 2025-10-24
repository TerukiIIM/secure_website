import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
	statusCode: number;
	isOperational: boolean;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;
		Error.captureStackTrace(this, this.constructor);
	}
}

export function errorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) {
	let { statusCode, message } = err;

	if (!statusCode) statusCode = 500;
	if (!message) message = "Internal Server Error";

	const response = {
		error: message,
		...(process.env.NODE_ENV === "development" && { stack: err.stack }),
	};

	console.error("[ERROR]", err);

	res.status(statusCode).json(response);
}
