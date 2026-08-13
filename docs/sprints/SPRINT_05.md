# Sprint 5 — Jornadas com vigência

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- tabelas `work_schedules` e `schedule_days`;
- jornada vinculada ao funcionário com nome e período de vigência;
- sete dias configuráveis individualmente como trabalho ou folga;
- entrada, saída, intervalo e tolerância por dia;
- cadastro, listagem e página de detalhes responsivas;
- criação de nova vigência a partir da jornada existente;
- preservação de jornadas históricas, sem edição destrutiva;
- prevenção transacional de períodos sobrepostos por funcionário;
- auditoria `CREATE_WORK_SCHEDULE` com toda a configuração semanal;
- validação Zod de horários, intervalos, datas e dias repetidos;
- migration `0004_aspiring_the_liberteens.sql`.

## Regras

- Ao menos um dia da semana deve ser trabalhado.
- Em dias trabalhados, entrada e saída são obrigatórias e a saída deve ser
  posterior à entrada.
- Intervalo é opcional, mas início e fim devem ser informados juntos e ficar
  dentro da jornada.
- Tolerância aceita de zero a 120 minutos.
- Vigência final não pode anteceder a inicial.
- Duas jornadas do mesmo funcionário não podem possuir períodos sobrepostos.
- Mudanças históricas criam uma nova vigência; a anterior não é sobrescrita.

## Validação

- migration aplicada ao PostgreSQL local;
- teste integrado criou sete dias e auditoria, detectou sobreposição e realizou
  rollback ao final;
- `npm test`: 7 arquivos e 30 testes aprovados;
- TypeScript, ESLint, build de produção e `git diff --check` aprovados;
- Drizzle sem divergências após geração da migration.

## Próximo passo

Sprint 6: escalas e visão de calendário, transformando a jornada vigente em
planejamento diário e permitindo exceções por data.
