import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import bcrypt from "bcrypt";
import { signToken } from "../utils/jwt";

const loginAttempts: Map<string, number> = new Map();
const LOGIN_COOLDOWN_MS = 5000;

export async function register(req: Request, res: Response) {
	try {
		const { name, email, password } = req.body;

		const { data: existingUser } = await supabase
			.from("users")
			.select("id")
			.eq("email", email)
			.single();
		if (existingUser) {
			return res.status(409).json({ error: "Email already registered" });
		}

		const hashed = await bcrypt.hash(password, 12);

		const { data: roleData, error: roleError } = await supabase
			.from("roles")
			.select("id")
			.eq("name", "USER")
			.single();
		if (roleError)
			return res.status(500).json({ error: "Roles table not configured" });

		const { data, error } = await supabase
			.from("users")
			.insert([
				{
					name,
					email,
					password_hash: hashed,
					role_id: roleData.id,
					token_version: 1,
				},
			])
			.select("id, name, email, role_id, created_at")
			.single();

		if (error) {
			if (error.code === "23505") {
				return res.status(409).json({ error: "Email already registered" });
			}
			return res.status(500).json({ error: error.message });
		}

		return res.status(201).json({
			id: data.id,
			name: data.name,
			email: data.email,
			message: "User registered successfully",
		});
	} catch (error: any) {
		return res
			.status(500)
			.json({ error: "Registration failed", details: error.message });
	}
}

export async function login(req: Request, res: Response) {
	try {
		const { email, password } = req.body;

		const now = Date.now();
		const last = loginAttempts.get(email) || 0;
		if (now - last < LOGIN_COOLDOWN_MS) {
			return res.status(429).json({
				error: `Too many login attempts. Please wait ${Math.ceil(
					(LOGIN_COOLDOWN_MS - (now - last)) / 1000
				)}s before retry`,
			});
		}
		loginAttempts.set(email, now);

		const { data: user, error } = await supabase
			.from("users")
			.select("id, name, email, password_hash, role_id, token_version")
			.eq("email", email)
			.single();

		if (error || !user) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const { data: role } = await supabase
			.from("roles")
			.select("can_post_login")
			.eq("id", user.role_id)
			.single();
		if (!role?.can_post_login) {
			return res
				.status(403)
				.json({ error: "Account is banned or does not have login permission" });
		}

		const token = signToken(
			{
				sub: user.id,
				email: user.email,
				token_version: user.token_version,
			},
			"1h"
		);

		return res.json({
			token,
			expires_in: 3600,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error: any) {
		return res
			.status(500)
			.json({ error: "Login failed", details: error.message });
	}
}
