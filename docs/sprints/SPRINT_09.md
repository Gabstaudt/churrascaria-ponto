# Sprint 9 — Situação diária e dashboard operacional

**Estado:** implementação concluída em 13 de agosto de 2026.

## Entregas

- service dedicado de apuração diária;
- comparação entre escala prevista e marcações originais;
- ordenação e pareamento sequencial de entradas e saídas;
- preservação integral das marcações originais;
- identificação de presença, atraso e marcação incompleta;
- identificação conservadora de possível ausência;
- distinção de folga, férias, afastamento e ausência de jornada;
- dashboard operacional por data;
- indicadores de ativos, presentes, atrasados, possíveis ausências, folgas e
  pendências;
- tabela diária com funcionário, previsão, realizado, situação e atalho para
  conferência;
- tratamento explícito do timezone `America/Belem`;
- layout responsivo seguindo o padrão administrativo.

## Situações calculadas

- `EXPECTED`: jornada prevista ainda não iniciada ou data futura;
- `PRESENT`: marcações completas e entrada dentro da tolerância;
- `LATE`: primeira marcação posterior à entrada somada à tolerância;
- `INCOMPLETE`: quantidade ímpar de marcações;
- `POSSIBLE_ABSENCE`: dia de trabalho iniciado ou encerrado sem marcações;
- `OFF`: folga planejada;
- `VACATION`: férias;
- `LEAVE`: afastamento;
- `NO_SCHEDULE`: funcionário sem jornada vigente.

O sistema não converte `POSSIBLE_ABSENCE` em falta definitiva. Essa decisão
depende dos tratamentos e justificativas das próximas sprints.

## Pareamento

As marcações são copiadas, ordenadas cronologicamente e agrupadas aos pares. A
primeira é considerada entrada e a segunda saída, repetindo a sequência. Quando
resta uma marcação sem par, o dia é classificado como incompleto. Nenhum registro
original é atualizado ou excluído durante a apuração.

## Dashboard

A rota `/admin` agora apresenta dados operacionais reais e permite selecionar a
data. Cada funcionário exibe:

- jornada ou indisponibilidade prevista;
- horários originais realizados;
- alerta de par incompleto;
- situação calculada;
- acesso às marcações filtradas daquele funcionário e data;
- acesso ao perfil detalhado.

## Validação

- 13 arquivos e 61 testes aprovados;
- ordenação sem mutação dos registros testada;
- pareamento completo e incompleto testado;
- presença e atraso testados;
- possível ausência e data futura testadas;
- virada de dia no timezone de Belém testada;
- TypeScript, ESLint, build de produção e `git diff --check` aprovados;
- nenhuma migration necessária nesta sprint.

## Próximo passo

Sprint 10: tratamentos de ponto com ajustes separados e auditáveis, preservando
as marcações originais.
