# Sprint 8 — Marcações originais simuladas

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- tabela `time_entries` para registros originais;
- horário oficial armazenado com timezone;
- origens `SIMULATOR`, `IMPORT` e `REP_C`;
- identificador externo e identificador opcional do dispositivo;
- metadata JSON para informações técnicas da captura;
- unicidade por origem e identificador externo;
- trigger PostgreSQL que bloqueia `UPDATE` e `DELETE`;
- importação idempotente com `ON CONFLICT DO NOTHING`;
- simulador administrativo controlado;
- uma a oito marcações por funcionário e data;
- listagem cronológica com filtros por funcionário, data e origem;
- integração das marcações ao perfil detalhado do funcionário;
- ausência intencional de ações de edição e exclusão;
- migration `0007_wealthy_tomas.sql`.

## Imutabilidade e idempotência

As marcações representam fatos originais recebidos. A aplicação não oferece
services ou ações de atualização e exclusão. O PostgreSQL também impede essas
operações por trigger, protegendo os dados mesmo fora da interface.

O simulador gera um identificador determinístico com funcionário, data e hora.
O reenvio do mesmo evento encontra a restrição única e é ignorado, sem criar
duplicidade.

Correções futuras serão armazenadas em entidades separadas e nunca alterarão a
marcação original.

## Interface

- `/admin/marcacoes`: consulta e filtros;
- `/admin/marcacoes/simular`: geração controlada;
- aba de ponto do perfil do funcionário com as marcações mais recentes;
- atalhos para consultar todas ou simular para o funcionário selecionado;
- layout administrativo e responsividade preservados;
- estilos limitados às telas de marcações e ao conteúdo da aba.

## Validação

- migration aplicada ao PostgreSQL local;
- 12 arquivos e 53 testes aprovados;
- identificadores determinísticos testados;
- conversão do fuso `America/Belem` testada;
- horários duplicados, inválidos e listas vazias testados;
- TypeScript, ESLint, build de produção e `git diff --check` aprovados.

## Próximo passo

Sprint 9: situação diária e dashboard operacional, comparando previsão e
marcações sem modificar os registros originais.
