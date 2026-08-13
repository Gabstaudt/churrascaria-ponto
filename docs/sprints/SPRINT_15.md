# Sprint 15 — Banco de Horas

## Objetivo

Manter saldos diários e acumulados em um extrato imutável, auditável e
reproduzível integralmente a partir dos lançamentos.

## Entregas

- tabelas `time_bank_entries` e `time_bank_policies`;
- migration `0011_cool_odin.sql`;
- lançamentos assinados em minutos inteiros: valores positivos são créditos e
  negativos são débitos;
- tipos `DAILY_CALCULATION`, `RECALCULATION` e `MANUAL_ADJUSTMENT`;
- referência à data, versão da apuração, política e impressão digital das origens;
- processamento de períodos com seleção de funcionário;
- reconciliação por diferença, sem editar ou excluir o histórico anterior;
- idempotência por impressão digital única de funcionário, data e origens;
- trava transacional PostgreSQL por funcionário/data para execuções concorrentes;
- ajustes manuais autorizados, com motivo obrigatório e auditoria;
- políticas com vigência e percentuais separados para créditos e débitos;
- política padrão de 100% quando nenhuma configuração estiver cadastrada;
- saldo diário resultante preservado em cada apuração ou recálculo;
- totais de crédito, débito, saldo do período e saldo acumulado;
- extrato filtrável por funcionário e período;
- acesso pela aba de ponto do funcionário e navegação administrativa desktop;
- layout responsivo isolado, preservando a navegação móvel principal.

## Modelo de reconciliação

O primeiro processamento de um dia grava o saldo calculado pelo motor
`attendance-v1`. Se as marcações, tratamentos, escala ou política mudarem, o novo
processamento não substitui o lançamento anterior: grava somente a diferença
entre o resultado anterior e o atual.

Exemplo:

- apuração original: `+60` minutos;
- nova apuração: `+35` minutos;
- recálculo lançado: `-25` minutos;
- saldo reproduzido pelo extrato: `60 - 25 = 35` minutos.

Execuções repetidas com a mesma impressão digital não geram novo lançamento.
Mesmo quando as origens mudam sem alterar o saldo, o recálculo de zero minutos
preserva a nova referência sem afetar o acumulado.

## Concorrência

O processamento e os ajustes manuais usam `pg_advisory_xact_lock` com uma chave
derivada de funcionário e data. Depois de obter a trava, o serviço verifica
novamente a impressão digital e o último saldo calculado. O índice único da
origem oferece uma segunda proteção contra duplicidade.

## Políticas

Cada política possui data de início de vigência e percentuais inteiros para
crédito e débito. A conversão utiliza basis points e truncamento para minutos
inteiros. O lançamento guarda a política aplicada; novas políticas afetam apenas
processamentos cuja data esteja na nova vigência e nunca reescrevem o extrato.

## Segurança e auditoria

- todas as mutações exigem administrador autenticado;
- ajustes manuais exigem motivo;
- apurações, recálculos, ajustes e políticas geram `auditLogs`;
- o extrato não possui operações de atualização ou exclusão;
- dias incompletos ou sem marcações permanecem pendentes e não alteram o saldo.

## Validação

- `npm run db:generate`;
- `npm run typecheck`;
- `npm test`;
- `npm run lint`;
- `npm run build`;
- `git diff --check`.
