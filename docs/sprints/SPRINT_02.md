# Sprint 2 — Autenticação e painel protegido

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- Better Auth com adapter Drizzle e credenciais por email/senha;
- tabelas `accounts`, `sessions`, `verifications` e `auth_audit_logs`;
- migração do hash de senha de `users` para a conta de credencial;
- cadastro público desativado e senha mínima de 12 caracteres;
- comando seguro `npm run admin:create` para o primeiro administrador;
- rota oficial `/api/auth/[...all]`;
- login responsivo, logout e recuperação de sessão;
- bloqueio de usuário inativo antes de criar sessão;
- proteção server-side de `/admin` e autorização por role `ADMIN`;
- página de acesso negado e layout administrativo responsivo;
- rate limiting específico para tentativas de login;
- auditoria persistente de login bem-sucedido e logout;
- Docker Compose para PostgreSQL de desenvolvimento;
- quatro novos testes de validação de autenticação.

## Decisões de segurança

- IDs continuam sendo UUIDs gerados pelo PostgreSQL; o Better Auth não gera IDs
  incompatíveis com o schema.
- Cadastro público fica desabilitado. O primeiro admin só pode ser criado por
  comando local com variáveis de ambiente.
- Role e `isActive` não são aceitos como entrada do navegador.
- Conta inativa não recebe sessão; sessões existentes também são rejeitadas pela
  proteção server-side, sem depender apenas da interface.
- Cookie seguro é obrigatório em produção; CSRF e verificação de origem do Better
  Auth permanecem habilitados.
- A mensagem de falha de login é genérica para evitar enumeração de contas.

## Validação executada

- `npm test`: 3 arquivos e 12 testes aprovados;
- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado;
- `npm run build -- --webpack`: build de produção aprovado;
- migration `0001_flawless_thanos.sql` gerada e revisada;
- `git diff --check`: aprovado ao final.

## Dependência de ambiente

O ambiente desta execução não possui Docker, PostgreSQL nem `.env`. Por isso as
migrations e os fluxos que exigem persistência não puderam ser executados contra
um banco real. O projeto agora inclui `compose.yaml`; para concluir a ativação
local:

```bash
docker compose up -d
cp .env.example .env
# configure BETTER_AUTH_SECRET no .env
npm run db:migrate
ADMIN_NAME="Administrador" ADMIN_EMAIL="admin@exemplo.com" \
  ADMIN_PASSWORD="uma-senha-forte" npm run admin:create
npm run dev
```

## Próximo passo

Após validar login/logout no PostgreSQL local, iniciar a Sprint 3: service,
cadastro e listagem de funcionários.
