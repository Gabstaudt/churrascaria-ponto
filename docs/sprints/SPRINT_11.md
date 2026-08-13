# Sprint 11 — Faltas e justificativas

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- fila diária de `POSSIBLE_ABSENCE`;
- ausência mantida como ambígua até decisão administrativa;
- tabela `absences` com classificação vigente;
- tabela append-only `absence_justifications` com todo o histórico;
- decisões de falta não justificada, justificada, atestado médico, folga,
  férias, afastamento, erro de marcação e outro;
- motivo e aprovador obrigatórios;
- reclassificação sem apagar justificativas anteriores;
- integração das decisões com o dashboard operacional;
- situações `ABSENCE_UNJUSTIFIED` e `ABSENCE_JUSTIFIED`;
- auditoria da decisão inicial e das reclassificações;
- migration `0009_rich_beyonder.sql`.

## Fluxo

Uma ausência sem marcações aparece apenas como possível ausência. O registro em
`absences` nasce somente quando um administrador informa uma decisão. Cada
decisão gera uma nova linha em `absence_justifications`.

Se a decisão for alterada, a classificação vigente é atualizada e uma nova
justificativa é adicionada. O histórico anterior permanece disponível e a
trigger do PostgreSQL bloqueia atualização ou exclusão das justificativas.

## Decisões

- `UNJUSTIFIED`;
- `JUSTIFIED`;
- `MEDICAL_CERTIFICATE`;
- `DAY_OFF`;
- `VACATION`;
- `LEAVE`;
- `TIME_ENTRY_ERROR`;
- `OTHER`.

Documentos de atestado serão vinculados em sprint posterior. Nesta sprint, a
classificação e o histórico já estão preparados, sem simular anexos.

## Interface

A rota `/admin/faltas` apresenta:

- seleção de data;
- quantidade de pendências e decisões;
- fila de possíveis ausências;
- decisões vigentes do dia;
- formulário de decisão;
- histórico com motivo, responsável e horário.

O dashboard direciona possíveis ausências e faltas decididas para essa tela. O
layout administrativo foi preservado e os estilos ficaram limitados a
`absence-*`.

## Validação

- migration aplicada ao PostgreSQL local;
- 16 arquivos e 72 testes aprovados;
- decisões válidas e inválidas testadas;
- motivo mínimo testado;
- TypeScript, ESLint, build de produção e `git diff --check` aprovados.

## Próximo passo

Sprint 12: auditoria administrativa completa, consulta segura e padronização da
trilha de alterações.
