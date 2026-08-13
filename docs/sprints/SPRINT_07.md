# Sprint 7 — Folgas, trocas, férias e afastamentos

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- cadastro e atualização de folgas pontuais;
- motivo obrigatório e administrador autorizador;
- solicitação de troca de folga com data de folga e data compensada;
- aprovação ou rejeição administrativa com justificativa;
- cadastro de períodos de férias;
- cadastro de afastamentos médicos, pessoais, legais ou de outro tipo;
- prevenção de conflitos entre folgas, trocas aprovadas, férias e afastamentos;
- reflexo automático dos registros no calendário de escalas;
- filtros de escala para trabalho, folga, férias, afastamento e ausência de
  jornada;
- auditoria completa das inclusões, atualizações e decisões;
- telas responsivas usando o layout administrativo padrão;
- migration `0006_special_darkstar.sql`.

## Ordem de resolução no calendário

1. férias ou afastamento;
2. folga pontual autorizada;
3. troca de folga aprovada;
4. ajuste excepcional da Sprint 6;
5. jornada semanal vigente;
6. ausência de jornada.

## Banco de dados

- `days_off`;
- `day_off_swaps`;
- `vacations`;
- `leave_periods`;
- enum `day_off_swap_status`;
- enum `leave_type`.

## Auditoria

- `CREATE_DAY_OFF` e `UPDATE_DAY_OFF`;
- `REQUEST_DAY_OFF_SWAP`;
- `APPROVE_DAY_OFF_SWAP` e `REJECT_DAY_OFF_SWAP`;
- `CREATE_VACATION`;
- `CREATE_LEAVE_PERIOD`.

## Validação

- migration aplicada ao PostgreSQL local;
- 10 arquivos e 46 testes aprovados;
- resolução de férias, afastamento, folga e troca testada;
- validação de períodos, tipos e decisões testada;
- TypeScript, ESLint, build de produção e `git diff --check` aprovados.

## Próximo passo

Sprint 8: marcações de ponto originais simuladas e imutáveis.
