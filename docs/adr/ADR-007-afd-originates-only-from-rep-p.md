# ADR-007 — AFD é originado exclusivamente no REP-P

## Decisão

O AFD é construído somente com operações originárias do registrador REP-P selecionado e vinculadas ao mesmo estabelecimento. Marcações usam `time_entries` com `source = REP_P`, `registrar_id`, `establishment_id`, NSR e timestamp originais.

Tratamentos do PTRP — ajustes, justificativas, faltas, banco de horas, apuração e fechamento — não são consultados pelo módulo AFD e nunca reescrevem uma geração existente. Um erro deve ser corrigido na fonte aplicável e resultar em nova geração, preservando a anterior.

## Consequência

O AFD permanece uma fotografia auditável do registrador. AEJ e Espelho continuam responsáveis pela apresentação dos tratamentos administrativos.
