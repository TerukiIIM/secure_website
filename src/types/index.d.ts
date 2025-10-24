import "express";

declare global {
	namespace Express {
		interface UserPayload {
			id: string;
			email?: string;
			name?: string;
			role_id?: string;
			role?: any;
		}

		interface Request {
			user?: UserPayload;
		}
	}
}

export {};
