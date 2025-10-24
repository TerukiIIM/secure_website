import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { supabase } from "../db/supabase";

export interface AuthRequest extends Request {
	user?: any;
}

export async function authMiddleware(
	req: AuthRequest,
	res: Response,
	next: NextFunction
) {
	try {
		const header = req.header("Authorization");
		if (!header || !header.startsWith("Bearer "))
			return res.status(401).json({ error: "Missing token" });
		const token = header.replace("Bearer ", "").trim();
		const payload: any = verifyToken(token);
		if (!payload?.sub) return res.status(401).json({ error: "Invalid token" });

		const { data, error } = await supabase
			.from("users")
			.select("id, name, email, role_id, token_version")
			.eq("id", payload.sub)
			.single();

		if (error || !data)
			return res.status(401).json({ error: "User not found" });

		if (payload.token_version !== data.token_version) {
			return res
				.status(401)
				.json({ error: "Token expired (version mismatch)" });
		}

		const { data: roleData } = await supabase
			.from("roles")
			.select("*")
			.eq("id", data.role_id)
			.single();

		req.user = { ...data, role: roleData };
		next();
	} catch (err: any) {
		return res
			.status(401)
			.json({ error: "Invalid token", details: err.message });
	}
}
