# Churrascaria Ponto

Sistema de gestão de jornada e ponto eletrônico da Churrascaria Marituba.

O projeto usa um monólito modular com Next.js, TypeScript, PostgreSQL, Drizzle
ORM e Tailwind CSS. As decisões completas de produto e arquitetura estão em
[`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md), e o roadmap está em
[`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md).

## Requisitos

- Node.js compatível com Next.js 16;
- npm;
- PostgreSQL acessível por uma connection string.
- Docker (opcional, recomendado para o PostgreSQL local).

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o PostgreSQL local, caso use Docker:

   ```bash
   docker compose up -d
   ```

3. Copie o arquivo de exemplo e ajuste a conexão e o segredo de autenticação:

   ```bash
   cp .env.example .env
   openssl rand -base64 32
   ```

   Copie a saída do `openssl` para `BETTER_AUTH_SECRET` no `.env`.

4. Aplique as migrations existentes:

   ```bash
   npm run db:migrate
   ```

5. Crie o primeiro administrador sem gravar senha no código:

   ```bash
   ADMIN_NAME="Administrador" \
   ADMIN_EMAIL="admin@exemplo.com" \
   ADMIN_PASSWORD="uma-senha-forte" \
   npm run admin:create
   ```

   A senha deve ter entre 12 e 128 caracteres, com maiúscula, minúscula, número
   e caractere especial. As variáveis acima existem somente durante o comando.

6. Inicie o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:3000`.

## Comandos

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o Next.js em desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run typecheck` | Valida os tipos sem emitir arquivos |
| `npm test` | Executa os testes uma vez |
| `npm run test:watch` | Executa os testes em modo interativo |
| `npm run db:generate` | Gera migration a partir dos schemas |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:studio` | Abre o Drizzle Studio |
| `npm run admin:create` | Cria o primeiro administrador com senha em variável de ambiente |

## Banco de dados

- A conexão está em `src/db/index.ts` e é marcada como `server-only`.
- Os schemas ficam em `src/db/schema`.
- As migrations versionadas ficam em `src/db/migrations`.
- `DATABASE_URL` nunca deve receber o prefixo `NEXT_PUBLIC_`.
- Alterações estruturais devem seguir: schema → `db:generate` → revisão do SQL →
  `db:migrate`.

Não edite manualmente migrations que já tenham sido aplicadas em ambientes
compartilhados ou de produção.

## Autenticação

- O cadastro público está desativado.
- Senhas são processadas pelo Better Auth e o hash fica em `accounts`.
- `/admin` é validado no servidor e exige usuário ativo com role `ADMIN`.
- O login possui rate limiting e retorna mensagem genérica para não revelar se
  uma conta existe ou está inativa.
- Login bem-sucedido e logout geram registros em `auth_audit_logs`.
