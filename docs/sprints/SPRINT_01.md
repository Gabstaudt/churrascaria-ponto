# Sprint 1 — Fundação de dados

**Estado:** implementação concluída em 7 de agosto de 2026.

## Entregas

- estrutura modular inicial em `src/db` e `src/validations`;
- configuração do Drizzle Kit para PostgreSQL via `DATABASE_URL`;
- conexão Drizzle/Postgres isolada por `server-only`, com reuso do client em
  desenvolvimento;
- tabelas iniciais `users` e `employees`;
- enums `user_role` e `employee_status`;
- unicidade de email, CPF e matrícula e índices de consulta;
- migration inicial e metadata do Drizzle versionadas;
- normalização e validação de CPF, telefone, data e dados do funcionário;
- Vitest e oito testes unitários;
- `.env.example`, scripts npm e README de configuração local.

## Decisões

- UUIDs são gerados pelo PostgreSQL com `gen_random_uuid()`.
- Timestamps são armazenados com timezone; datas civis como admissão usam `date`.
- CPF é armazenado com onze dígitos, sem máscara.
- Durações e entidades futuras não foram antecipadas nesta migration.
- `DATABASE_URL` é obrigatória e nunca possui prefixo `NEXT_PUBLIC_`.
- O client Postgres usa prepared statements desativados para manter compatibilidade
  com poolers comuns de PostgreSQL hospedado.
- A migration é gerada pelo Drizzle Kit e não foi editada manualmente.

## Validação executada

- `npm test`: 2 arquivos e 8 testes aprovados;
- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado;
- `npm run build -- --webpack`: build de produção aprovado;
- `npm run db:generate`: nenhuma divergência após a migration inicial;
- `git diff --check`: aprovado.

O build padrão com Turbopack encontrou uma limitação do ambiente de execução ao
tentar abrir uma porta durante o processamento de CSS. A compilação equivalente
com Webpack, suportada oficialmente pelo Next.js 16, foi concluída.

## Dependência de ambiente

Não havia `DATABASE_URL`, cliente PostgreSQL ou servidor PostgreSQL local
disponível. Portanto, a migration foi gerada e revisada, mas sua aplicação em um
banco externo deve ser feita assim que a connection string de desenvolvimento
for configurada:

```bash
cp .env.example .env
npm run db:migrate
```

Esse passo altera o banco indicado pela connection string e não deve ser executado
contra produção sem revisão do ambiente.

## Segurança de dependências

`npm audit` reportou quatro avisos moderados transitivos e restritos à ferramenta
de desenvolvimento Drizzle Kit/esbuild. A correção automática sugerida faria
downgrade incompatível do Drizzle Kit; por isso não foi aplicada. Não foram
reportadas vulnerabilidades altas ou críticas.

## Próximo passo

Configurar um PostgreSQL de desenvolvimento, aplicar a migration e então iniciar
a Sprint 2: autenticação, primeiro admin, sessão, proteção de `/admin` e layout.
