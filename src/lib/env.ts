import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// https://env.t3.gg/docs/core
export const env = createEnv({
	server: {
    PORT: z
      .string()
      .transform((val) => Number.parseInt(val, 10))
      .default("3001"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    // Database
		TURSO_DATABASE_URL: z.string().min(1),
		TURSO_DATABASE_AUTH_TOKEN: z.string().min(1),
    // private key
		BACKEND_PRIVATE_KEY: z.string().min(1),
    // redis
		REDIS_URL: z.string().min(1),
    // neynar
		NEYNAR_API_KEY: z.string().min(1),
    // agent
		RECEIVE_AGENT_SECRET: z.string().min(1),
		NEXT_PUBLIC_AGENT_URL: z.string().min(1),
	},
	runtimeEnvStrict: {
		PORT: process.env.PORT,
		NODE_ENV: process.env.NODE_ENV,
		TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
		TURSO_DATABASE_AUTH_TOKEN: process.env.TURSO_DATABASE_AUTH_TOKEN,
		BACKEND_PRIVATE_KEY: process.env.BACKEND_PRIVATE_KEY,
		REDIS_URL: process.env.REDIS_URL,
		NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
		RECEIVE_AGENT_SECRET: process.env.RECEIVE_AGENT_SECRET,
		NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL,
	},
});
