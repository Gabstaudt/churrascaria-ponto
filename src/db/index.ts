import "server-only";

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

const client =
  globalForDatabase.postgresClient ??
  postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresClient = client;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
