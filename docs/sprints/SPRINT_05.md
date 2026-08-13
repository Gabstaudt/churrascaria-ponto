# Sprint 5 — Gestão de jornadas com vigência

**Estado:** concluída em 13 de agosto de 2026

**Tipo do PR:** feature

**Migration:** `0004_aspiring_the_liberteens.sql`

## Título sugerido do pull request

`feat: implementa gestão completa de jornadas de trabalho`

## Resumo

Este pull request adiciona o módulo de jornadas de trabalho. Administradores
podem cadastrar, consultar e editar a escala semanal de cada funcionário,
informando o período de vigência, os dias trabalhados, horários, intervalos e
tolerância.

O fluxo foi construído com validação no servidor, prevenção transacional de
vigências sobrepostas e registro de auditoria. As telas de listagem, criação,
detalhamento e edição também foram padronizadas para desktop e dispositivos
móveis.

## Entregas funcionais

- listagem das jornadas cadastradas;
- indicadores com total de jornadas, funcionários com escala e jornadas sem
  data final;
- cadastro de jornada vinculada a funcionário ativo;
- configuração individual dos sete dias da semana;
- definição de dias trabalhados e dias de folga;
- entrada, saída, início e fim do intervalo por dia;
- tolerância configurável em minutos;
- período de vigência com data inicial obrigatória e data final opcional;
- página de detalhamento com resumo da vigência e semana completa;
- criação de uma nova vigência a partir do funcionário da jornada atual;
- edição de jornada com carregamento dos valores existentes;
- mensagem de confirmação após criação ou atualização;
- tratamento de estado vazio quando não existem jornadas.

## Interface e responsividade

- cabeçalho e indicadores modernos na tela inicial de jornadas;
- listagem em linhas estruturadas no desktop e cards adaptados no celular;
- formulário dividido entre identificação, vigência e semana de trabalho;
- dias apresentados como linhas compactas no desktop;
- campos empilhados e ações adaptadas para telas pequenas;
- detalhe da jornada organizado por dia, horário, intervalo e tolerância;
- estilos de jornadas isolados dos estilos do perfil do funcionário;
- correção do detalhamento do funcionário para impedir alongamento ou
  distorção dos cartões após a inclusão do módulo de jornadas.

## Banco de dados

Foram adicionadas as tabelas:

- `work_schedules`: funcionário, nome da jornada e período de vigência;
- `schedule_days`: configuração de cada dia vinculada à jornada.

A migration cria também:

- chave estrangeira entre jornada e funcionário;
- chave estrangeira entre dia e jornada;
- índice para consultas por funcionário;
- índice para consultas por vigência;
- restrição de unicidade para impedir dois registros do mesmo dia em uma
  jornada.

## Regras de negócio

- toda jornada deve possuir exatamente os sete dias da semana;
- ao menos um dia deve estar marcado como trabalhado;
- entrada e saída são obrigatórias nos dias trabalhados;
- a saída deve ser posterior à entrada;
- o intervalo é opcional, mas início e fim devem ser preenchidos juntos;
- o intervalo deve estar dentro do horário de trabalho;
- a tolerância aceita valores de zero a 120 minutos;
- a data final não pode anteceder a data inicial;
- jornadas do mesmo funcionário não podem ter vigências sobrepostas;
- a verificação de sobreposição utiliza transação e bloqueio consultivo no
  PostgreSQL para evitar cadastros concorrentes inválidos;
- toda criação e atualização exige uma sessão administrativa válida.

## Edição e preservação do histórico

A jornada pode ser corrigida pela tela de edição. A alteração substitui os
dados semanais da jornada selecionada dentro de uma transação, mas registra o
estado anterior e o novo estado na auditoria.

Quando a mudança representar um novo período de trabalho, a interface oferece
“Nova vigência”, preservando a jornada anterior como um registro separado.

## Auditoria

- `CREATE_WORK_SCHEDULE`: registra funcionário, vigência e configuração dos
  sete dias;
- `UPDATE_WORK_SCHEDULE`: registra os estados anterior e posterior da jornada,
  incluindo os horários semanais;
- o usuário administrativo responsável é armazenado em `performedBy`.

## Rotas entregues

| Rota | Finalidade |
| --- | --- |
| `/admin/jornadas` | Listar jornadas e apresentar indicadores |
| `/admin/jornadas/nova` | Cadastrar uma jornada |
| `/admin/jornadas/[id]` | Consultar a jornada completa |
| `/admin/jornadas/[id]/editar` | Editar a jornada selecionada |

## Principais arquivos

- `src/db/schema/work-schedules.ts`;
- `src/db/migrations/0004_aspiring_the_liberteens.sql`;
- `src/validations/work-schedule.ts`;
- `src/services/work-schedule.service.ts`;
- `src/actions/work-schedules.ts`;
- `src/components/schedules/work-schedule-form.tsx`;
- `app/admin/jornadas/page.tsx`;
- `app/admin/jornadas/nova/page.tsx`;
- `app/admin/jornadas/[id]/page.tsx`;
- `app/admin/jornadas/[id]/editar/page.tsx`;
- `app/globals.css`.

## Como testar manualmente

1. Inicie o PostgreSQL com `docker compose up -d`.
2. Aplique as migrations com `npm run db:migrate`.
3. Inicie a aplicação com `npm run dev`.
4. Entre com um usuário administrador.
5. Acesse **Jornadas** e confirme os indicadores e o estado vazio ou a
   listagem existente.
6. Cadastre uma jornada com dias de trabalho e folgas.
7. Abra a jornada e confira todos os horários no detalhe.
8. Clique em **Editar**, altere um horário e salve.
9. Confirme a mensagem de sucesso e os novos dados no detalhe.
10. Tente cadastrar ou editar uma vigência sobreposta e confirme que a
    operação é recusada.
11. Repita a navegação em largura de celular e confirme que não há rolagem
    horizontal nem campos cortados.

## Validação técnica realizada

- migration aplicada ao PostgreSQL local;
- teste integrado de criação dos sete dias e da auditoria;
- teste de detecção de vigência sobreposta;
- rollback do teste integrado realizado ao final;
- `npm test`: 7 arquivos e 30 testes aprovados;
- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado;
- build de produção com Next.js: aprovado;
- `git diff --check`: aprovado;
- rota dinâmica de edição reconhecida no build.

## Checklist do pull request

- [x] Schema e migration criados.
- [x] Validação de horários e vigência implementada.
- [x] Proteção contra sobreposição implementada.
- [x] Cadastro de jornada implementado.
- [x] Listagem e indicadores implementados.
- [x] Detalhamento semanal implementado.
- [x] Edição de jornada implementada.
- [x] Auditoria de criação e atualização implementada.
- [x] Interface responsiva revisada.
- [x] Testes, lint, TypeScript e build aprovados.

## Próximo passo

Sprint 6: escalas e visão de calendário, transformando a jornada vigente em
planejamento diário e permitindo exceções específicas por data.
