import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não definida no ambiente do servidor.");
}

const globalForDatabase = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

export const postgresClient =
  globalForDatabase.postgresClient ??
  postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresClient = postgresClient;
}

export const db = drizzle(postgresClient, { schema });

export type Database = typeof db;
