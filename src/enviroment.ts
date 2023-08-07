import dotenv from "dotenv";
import { PlanetScaleDialectConfig } from "kysely-planetscale";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const HOST = process.env.HOST || "localhost";
export const JWT_SECRET = process.env.JWT_SECRET!;
export const COOKIE_SECRET = process.env.COOKIE_SECRET || "secret";

export const DB_OPTIONS = {
  host: process.env.DATABASE_HOST!,
  username: process.env.DATABASE_USERNAME!,
  password: process.env.DATABASE_PASSWORD!
} satisfies PlanetScaleDialectConfig;
