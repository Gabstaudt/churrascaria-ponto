import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { authAuditLogs, users } from "@/db/schema";

const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET deve possuir pelo menos 32 caracteres.");
}

export const auth = betterAuth({
  appName: "Churrascaria Ponto",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: { type: ["ADMIN", "MANAGER", "EMPLOYEE"], required: true, defaultValue: "EMPLOYEE", input: false },
      isActive: { type: "boolean", required: true, defaultValue: true, input: false },
      employeeId: { type: "string", required: false, input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30 },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [user] = await db.select({ isActive: users.isActive }).from(users).where(eq(users.id, session.userId)).limit(1);
          return user?.isActive === true;
        },
        after: async (session) => {
          await db.insert(authAuditLogs).values({ action: "LOGIN_SUCCESS", userId: session.userId, ipAddress: session.ipAddress ?? null, userAgent: session.userAgent ?? null });
        },
      },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30, customRules: { "/sign-in/email": { window: 60, max: 5 } } },
  advanced: {
    cookiePrefix: "churrascaria_ponto",
    useSecureCookies: process.env.NODE_ENV === "production",
    database: { generateId: false },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
