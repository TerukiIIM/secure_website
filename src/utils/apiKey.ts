import crypto from "crypto";
import bcrypt from "bcrypt";

export function generateApiKey(): string {
	const randomBytes = crypto.randomBytes(32);
	const randomString = randomBytes.toString("base64url");

	return `sk_live_${randomString}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
	const saltRounds = 12;
	return bcrypt.hash(apiKey, saltRounds);
}

export async function verifyApiKey(
	apiKey: string,
	hash: string
): Promise<boolean> {
	return bcrypt.compare(apiKey, hash);
}
