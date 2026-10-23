import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["dev", "prod"]).default("dev"),
});

export const env = envSchema.parse(process.env);
