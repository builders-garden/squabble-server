import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { env } from "../env.js";

const adapter = new PrismaLibSQL({
  url: env.TURSO_DATABASE_URL || "",
  authToken: env.TURSO_DATABASE_AUTH_TOKEN,
});
export const prisma = new PrismaClient({ adapter });
