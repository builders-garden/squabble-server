import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// https://env.t3.gg/docs/nextjs
export const env = createEnv({
  server: {
    TURSO_DATABASE_URL: z.string().min(1),
    TURSO_DATABASE_AUTH_TOKEN: z.string().min(1),
    BACKEND_PRIVATE_KEY: z.string().min(1),
  },
  runtimeEnvStrict: {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_DATABASE_AUTH_TOKEN: process.env.TURSO_DATABASE_AUTH_TOKEN,
    BACKEND_PRIVATE_KEY: process.env.BACKEND_PRIVATE_KEY,
  },
});
