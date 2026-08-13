# Sprint 3 — Funcionários: cadastro e listagem

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- módulo administrativo em `/admin/funcionarios`;
- listagem server-side ordenada por nome;
- busca por nome, CPF, matrícula ou cargo;
- filtro por status e paginação de dez registros;
- formulário responsivo em `/admin/funcionarios/novo`;
- Server Action com autenticação e autorização administrativa próprias;
- validação Zod no servidor, normalização de CPF e telefone;
- service transacional de criação e consulta;
- mensagens amigáveis para CPF ou matrícula duplicados;
- restrições de unicidade preservadas no PostgreSQL;
- `EmployeeStatusBadge`, estados vazio/sucesso/erro e navegação ativa;
- tabela `audit_logs` e auditoria de criação na mesma transação;
- migration `0002_small_strong_guy.sql`;
- sete novos testes, totalizando dezenove.

## Decisões

- A interface nunca importa a conexão com banco; UI → Server Action → service →
  Drizzle → PostgreSQL.
- Cada Server Action revalida sessão e role, mesmo dentro de rota protegida.
- Auditoria e criação são atômicas: ambas persistem ou ambas sofrem rollback.
- CPF é buscado e armazenado normalizado, mas exibido com máscara.
- Datas civis são formatadas sem conversão de timezone.
- Erros internos são registrados no servidor sem expor SQL ao usuário.
- A tabela de auditoria geral foi criada agora por haver o primeiro evento de
  domínio real; não foram antecipadas ações das próximas sprints.

## Validação executada

- migration aplicada ao PostgreSQL local e tabela `audit_logs` confirmada;
- teste integrado de inserção, consulta e auditoria em transação com rollback;
- `npm test`: 5 arquivos e 19 testes aprovados;
- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado;
- `npm run build -- --webpack`: build de produção aprovado;
- `npm run db:generate`: schema e migrations sem divergências;
- `git diff --check`: aprovado.

## Observação sobre migrations

O banco já continha o histórico em `public.__drizzle_migrations`, enquanto uma
execução intermediária do Drizzle criou também `drizzle.__drizzle_migrations`.
A configuração foi fixada explicitamente para continuar usando o histórico
original em `public`, e a migration `0002` foi então aplicada corretamente. A
tabela vazia no schema `drizzle` é inofensiva e não é usada pelo projeto.

## Próximo passo

Validar manualmente o cadastro e a busca no navegador e iniciar a Sprint 4:
detalhe, edição, status, inativação e reativação de funcionários.
