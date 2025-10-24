import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

export function signToken(payload: object, expiresIn: string | number = "1h") {
	return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
	return jwt.verify(token, JWT_SECRET) as any;
}
