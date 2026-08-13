import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ hashPassword }, { eq }, { db, postgresClient }, { accounts, users }, { createAdminSchema }] = await Promise.all([
    import("better-auth/crypto"),
    import("drizzle-orm"),
    import("../src/db/connection"),
    import("../src/db/schema/index"),
    import("../src/validations/auth"),
  ]);

  try {
    const input = createAdminSchema.safeParse({ name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    if (!input.success) throw new Error("Defina ADMIN_NAME, ADMIN_EMAIL e uma ADMIN_PASSWORD forte (12+ caracteres, maiúscula, minúscula, número e símbolo).");

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.data.email)).limit(1);
    if (existing.length > 0) throw new Error("Já existe um usuário com esse email. Nenhuma alteração foi feita.");

    const password = await hashPassword(input.data.password);
    await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({ name: input.data.name, email: input.data.email, emailVerified: true, role: "ADMIN", isActive: true }).returning({ id: users.id });
      if (!user) throw new Error("Não foi possível criar o administrador.");
      await tx.insert(accounts).values({ accountId: user.id, providerId: "credential", userId: user.id, password });
    });
    console.info(`Administrador criado com sucesso: ${input.data.email}`);
  } finally {
    await postgresClient.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha ao criar administrador.");
  process.exitCode = 1;
});
