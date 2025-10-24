import dotenv from "dotenv";
import { supabase } from "../db/supabase";
import bcrypt from "bcrypt";
dotenv.config();

async function seed() {
	console.log("🌱 Starting database seed...");

	try {
		console.log("📝 Creating roles...");
		const roles = [
			{
				name: "ADMIN",
				can_post_login: true,
				can_get_my_user: true,
				can_get_users: true,
				can_post_products: true,
				can_upload_images: true,
				can_get_bestsellers: true,
			},
			{
				name: "PREMIUM",
				can_post_login: true,
				can_get_my_user: true,
				can_get_users: false,
				can_post_products: true,
				can_upload_images: true,
				can_get_bestsellers: true,
			},
			{
				name: "USER",
				can_post_login: true,
				can_get_my_user: true,
				can_get_users: false,
				can_post_products: true,
				can_upload_images: false,
				can_get_bestsellers: false,
			},
			{
				name: "BAN",
				can_post_login: false,
				can_get_my_user: false,
				can_get_users: false,
				can_post_products: false,
				can_upload_images: false,
				can_get_bestsellers: false,
			},
		];

		for (const r of roles) {
			const { error } = await supabase
				.from("roles")
				.upsert(r, { onConflict: "name" });
			if (error) {
				console.error(`❌ Error creating role ${r.name}:`, error.message);
			} else {
				console.log(`✅ Role ${r.name} created/updated`);
			}
		}

		const { data: adminRole } = await supabase
			.from("roles")
			.select("id")
			.eq("name", "ADMIN")
			.single();
		const { data: premiumRole } = await supabase
			.from("roles")
			.select("id")
			.eq("name", "PREMIUM")
			.single();
		const { data: banRole } = await supabase
			.from("roles")
			.select("id")
			.eq("name", "BAN")
			.single();
		const { data: userRole } = await supabase
			.from("roles")
			.select("id")
			.eq("name", "USER")
			.single();

		if (!adminRole || !premiumRole || !banRole || !userRole) {
			throw new Error("Failed to fetch roles");
		}

		console.log("👥 Creating test users...");
		const hashed = await bcrypt.hash("Password123!", 12);

		const testUsers = [
			{
				email: "admin@example.com",
				name: "Admin User",
				password_hash: hashed,
				role_id: adminRole.id,
				token_version: 1,
			},
			{
				email: "premium@example.com",
				name: "Premium User",
				password_hash: hashed,
				role_id: premiumRole.id,
				token_version: 1,
			},
			{
				email: "user@example.com",
				name: "Regular User",
				password_hash: hashed,
				role_id: userRole.id,
				token_version: 1,
			},
			{
				email: "banned@example.com",
				name: "Banned User",
				password_hash: hashed,
				role_id: banRole.id,
				token_version: 1,
			},
		];

		for (const user of testUsers) {
			const { error } = await supabase
				.from("users")
				.upsert(user, { onConflict: "email" });
			if (error) {
				console.error(`❌ Error creating user ${user.email}:`, error.message);
			} else {
				console.log(`✅ User ${user.email} created/updated`);
			}
		}

		console.log("\n✅ Seed completed successfully!");
		console.log("\n📋 Test credentials:");
		console.log("   Admin: admin@example.com / Password123!");
		console.log("   User:  user@example.com / Password123!");
		console.log("   Ban:   banned@example.com / Password123! (cannot login)");
	} catch (err: any) {
		console.error("❌ Seed failed:", err.message);
		process.exit(1);
	}
}

seed().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
