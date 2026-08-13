# Sprint 6 — Escalas e visão de calendário

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- módulo administrativo de escalas em `/admin/escalas`;
- visões diária, semanal e mensal;
- navegação entre períodos;
- resolução automática da jornada vigente para cada funcionário e data;
- distinção entre trabalho, folga e ausência de jornada vigente;
- filtros por funcionário, cargo e situação;
- ajustes excepcionais por data;
- folga excepcional ou trabalho com horário excepcional;
- motivo obrigatório e identificação do administrador responsável;
- precedência da exceção sobre a jornada semanal;
- auditoria da criação e atualização de exceções;
- interface responsiva para desktop e celular;
- migration `0005_fancy_ogun.sql`.

## Regra de resolução

Para cada funcionário e data, o sistema:

1. procura um ajuste excepcional para a data;
2. se existir, utiliza a situação e os horários do ajuste;
3. caso contrário, localiza a jornada vigente no período;
4. resolve o dia da semana como trabalho ou folga;
5. informa `NO_SCHEDULE` quando não existe jornada aplicável.

## Banco e auditoria

A tabela `schedule_exceptions` registra funcionário, data, tipo do ajuste,
horários opcionais, intervalo, tolerância, motivo, responsável e timestamps.
Existe uma restrição única por funcionário e data.

As ações `CREATE_SCHEDULE_EXCEPTION` e `UPDATE_SCHEDULE_EXCEPTION` registram os
estados anterior e posterior no `audit_logs`.

## Validação

- migration aplicada ao PostgreSQL local;
- 9 arquivos e 38 testes aprovados;
- testes da resolução da jornada, folga, ausência de jornada e precedência da
  exceção;
- testes de horários e intervalos dos ajustes;
- TypeScript aprovado;
- ESLint aprovado;
- build de produção aprovado;
- `git diff --check` aprovado.

## Próximo passo

Sprint 7: folgas, trocas, férias e afastamentos com aprovação, prevenção de
conflitos e reflexo automático na escala.
