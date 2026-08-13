# Sprint 16 — Fechamento de Competência

## Objetivo

Estabilizar os resultados mensais antes dos relatórios, impedindo alterações
silenciosas depois do fechamento e preservando todas as revisões.

## Entregas

- tabelas `closing_periods`, `closing_period_events` e
  `closing_period_summaries`;
- migration `0012_busy_network.sql`;
- workflow `OPEN → IN_REVIEW → CLOSED`;
- reabertura `CLOSED → OPEN` somente por administrador e com motivo obrigatório;
- eventos append-only para criação, revisão, fechamento e reabertura;
- revisão numérica incrementada a cada novo fechamento;
- snapshot por funcionário com minutos previstos, trabalhados, atraso, saída
  antecipada, extras, faltas, ausências justificadas e banco de horas;
- snapshots anteriores preservados após reabertura;
- painel de pendências críticas e alertas;
- totais mensais de atrasos, adicionais, faltas e banco de horas;
- prévia dinâmica enquanto a competência está aberta ou em revisão;
- visualização congelada da revisão atual depois do fechamento;
- tela de histórico de workflow com responsável, data, estados e motivo;
- acesso administrativo em `/admin/fechamentos`;
- layout responsivo isolado e navegação móvel principal preservada.

## Pendências de fechamento

Bloqueiam o fechamento:

- competência cujo último dia ainda não terminou;
- pares de marcações incompletos;
- possíveis ausências sem decisão administrativa;
- dias completos ainda não processados no banco de horas.

Dias sem jornada configurada são apresentados como alerta para conferência, mas
não bloqueiam automaticamente o fechamento.

## Congelamento lógico

Quando uma competência está fechada, operações que alterariam seus resultados
adquirem a mesma trava transacional da competência e são rejeitadas:

- importação ou simulação de marcações;
- tratamentos de ponto;
- decisões de falta;
- atestados médicos;
- folgas, trocas, férias e afastamentos;
- exceções de escala;
- criação ou edição de jornadas com vigência sobreposta;
- processamento e ajustes do banco de horas.

A trava PostgreSQL também serializa o fechamento com essas operações, reduzindo
o risco de alterações concorrentes durante a consolidação.

## Reabertura e revisões

A reabertura exige justificativa de pelo menos dez caracteres, gera evento e
auditoria e não exclui o snapshot fechado. Após correções, a competência percorre
novamente a revisão e o próximo fechamento grava uma nova revisão imutável.

## Segurança e auditoria

- todas as ações exigem `ADMIN` autenticado;
- transições inválidas são rejeitadas;
- criação, revisão, fechamento e reabertura geram `auditLogs`;
- o motivo da reabertura fica no evento e na auditoria;
- testes cobrem autorização, workflow, bloqueadores, datas e consistência dos
  totais congelados.

## Validação

- `npm run db:generate`;
- `npm run typecheck`;
- `npm test`;
- `npm run lint`;
- `npm run build`;
- `git diff --check`.
