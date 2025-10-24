import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middleware/auth.middleware";

export async function getMyUser(req: AuthRequest, res: Response) {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Unauthenticated" });

		const { data, error } = await supabase
			.from("users")
			.select("id, name, email, role_id, created_at")
			.eq("id", user.id)
			.single();

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		res.json({
			user: {
				...data,
				role: user.role,
			},
		});
	} catch (error: any) {
		return res
			.status(500)
			.json({ error: "Failed to fetch user", details: error.message });
	}
}

export async function changePassword(req: AuthRequest, res: Response) {
	try {
		const user = req.user;
		const { old_password, new_password } = req.body;

		const { data: dbUser } = await supabase
			.from("users")
			.select("password_hash, token_version")
			.eq("id", user.id)
			.single();

		if (!dbUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const ok = await bcrypt.compare(old_password, dbUser.password_hash);
		if (!ok) {
			return res.status(401).json({ error: "Old password incorrect" });
		}

		const hashed = await bcrypt.hash(new_password, 12);

		const newVersion = (dbUser.token_version || 1) + 1;

		const { error } = await supabase
			.from("users")
			.update({ password_hash: hashed, token_version: newVersion })
			.eq("id", user.id);

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		res.json({
			success: true,
			message:
				"Password changed successfully. Please login again with your new password.",
		});
	} catch (error: any) {
		return res
			.status(500)
			.json({ error: "Password change failed", details: error.message });
	}
}

export async function listUsers(req: AuthRequest, res: Response) {
	try {
		const { data, error } = await supabase.from("users").select(`
        id, 
        name, 
        email, 
        role_id,
        created_at,
        roles (
          name,
          can_post_login,
          can_get_my_user,
          can_get_users
        )
      `);

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		res.json({ users: data, count: data.length });
	} catch (error: any) {
		return res
			.status(500)
			.json({ error: "Failed to fetch users", details: error.message });
	}
}
