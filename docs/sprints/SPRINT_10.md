# Sprint 10 — Tratamentos de ponto

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- tabela append-only `time_adjustments`;
- inclusão de marcação faltante;
- desconsideração lógica de marcação original;
- registro de saída esquecida;
- justificativa de atraso;
- justificativa de saída antecipada;
- motivo obrigatório, responsável, funcionário e data;
- vínculo opcional com a marcação original;
- histórico permanente de tratamentos;
- visualização conjunta de originais e tratamentos;
- apuração diária baseada na visão efetiva sem alterar os originais;
- situação `LATE_JUSTIFIED`;
- acesso à conferência pelo dashboard operacional;
- migration `0008_perpetual_blue_blade.sql`.

## Integridade

`time_entries` continua imutável. Inclusões criam eventos de ajuste e
desconsiderações apenas removem logicamente um original da visão efetiva. A
lista original permanece intacta.

Os tratamentos também são append-only. Uma trigger PostgreSQL bloqueia `UPDATE`
e `DELETE`, garantindo que correções posteriores sejam novos eventos e que o
histórico administrativo permaneça explicável.

## Tipos

- `ADD_ENTRY`;
- `IGNORE_ENTRY`;
- `FORGOTTEN_EXIT`;
- `JUSTIFY_LATE`;
- `JUSTIFY_EARLY_EXIT`.

## Interface

A rota `/admin/tratamentos?employeeId=...&date=...` apresenta:

- identificação do funcionário e data;
- marcações originais imutáveis;
- histórico de tratamentos e responsáveis;
- formulário contextual de novo tratamento;
- retorno ao painel operacional.

O layout administrativo foi preservado e os estilos ficaram limitados a
`treatment-*`.

## Validação

- migration aplicada ao PostgreSQL local;
- 15 arquivos e 68 testes aprovados;
- inclusão sem mutação dos originais testada;
- desconsideração lógica sem exclusão testada;
- justificativa de atraso testada;
- validação de horário e vínculo original testada;
- TypeScript, ESLint, build de produção e `git diff --check` aprovados.

## Próximo passo

Sprint 11: faltas e justificativas, transformando possíveis ausências em decisões
administrativas auditáveis.
