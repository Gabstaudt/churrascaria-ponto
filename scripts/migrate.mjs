import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não definida para a migration.");
const client = postgres(databaseUrl, { max: 1, prepare: false });
try { const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "db", "migrations"); await migrate(drizzle(client), { migrationsFolder: directory }); console.info(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", event: "database.migrated" })); } finally { await client.end(); }
