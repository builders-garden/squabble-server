import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { env } from "../env";

const adapter = new PrismaLibSQL({
	url: env.TURSO_DATABASE_URL,
	authToken: env.TURSO_DATABASE_AUTH_TOKEN,
});
export const prisma = new PrismaClient({ adapter });
