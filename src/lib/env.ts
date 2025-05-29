import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// https://env.t3.gg/docs/nextjs
export const env = createEnv({
  server: {
    TURSO_DATABASE_URL: z.string().min(1),
    TURSO_DATABASE_AUTH_TOKEN: z.string().min(1),
    BACKEND_PRIVATE_KEY: z.string().min(1),
  },
});
