import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["dev", "prod"]).default("dev"),
  CONTENT_ROOT: z.string().min(1),
  THUMBNAIL_ROOT: z.string().min(1),
});

export const env = envSchema.parse(process.env);
