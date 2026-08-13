# Sprint 4 — Funcionários: detalhe, edição e status

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- perfil detalhado do funcionário;
- edição controlada de dados pessoais, profissionais e contato de emergência;
- tratamento dos status `ACTIVE`, `VACATION`, `LEAVE`, `TERMINATED` e `INACTIVE`;
- sincronização segura entre status e indicador `isActive`;
- inativação e reativação com confirmação, sem exclusão física;
- auditoria transacional com estado anterior/posterior;
- histórico administrativo visível no perfil;
- responsável, data/hora em `America/Belem`, ação, motivo e campos alterados;
- estrutura visual responsiva para desktop e celular;
- regras de status extraídas para funções testáveis;
- oito novos testes unitários, totalizando 27.

## Decisões

- “Excluir” funcionário significa inativar; nenhum registro com potencial
  histórico trabalhista é removido fisicamente.
- `VACATION` e `LEAVE` preservam vínculo ativo. `INACTIVE` e `TERMINATED`
  desativam o vínculo. A reativação explícita retorna para `ACTIVE`.
- Toda Server Action revalida sessão, usuário ativo, role administrativa e ID.
- Mudança e auditoria usam a mesma transação.
- O histórico mostra quais campos mudaram, mas não renderiza dumps completos dos
  dados nem informações internas do banco.

## Validação executada

- `npm test`: 6 arquivos e 27 testes aprovados;
- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado;
- `npm run build -- --webpack`: build de produção aprovado;
- `npm run db:generate`: nenhuma divergência;
- teste integrado no PostgreSQL do ciclo criar → editar → inativar → reativar →
  consultar auditoria, com rollback ao final;
- `git diff --check`: aprovado.

## Critério de aceite

O primeiro marco funcional está implementado: login → painel → funcionários →
cadastrar → listar → visualizar → editar → inativar → reativar, usando
PostgreSQL real e auditoria persistente.

## Próximo passo

Iniciar a Sprint 5: jornadas com dias da semana, horários, intervalos,
tolerâncias e vigência histórica.
