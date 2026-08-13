# Sprint 14 — Motor de Cálculo Diário

## Objetivo

Calcular a jornada efetiva de forma determinística, explicável e sem alterar os
registros originais de ponto.

## Entregas

- motor puro `calculateAttendance`, versionado como `attendance-v1`;
- serviço `attendance.service` para reunir escala resolvida, marcações originais
  e tratamentos antes do cálculo;
- apuração de minutos previstos, intervalo previsto, trabalhados, atraso, saída
  antecipada, horas extras, déficit e saldo;
- resultados exclusivamente em minutos inteiros;
- aplicação explícita da tolerância ao atraso e à saída antecipada;
- tratamentos aplicados em memória, preservando os eventos originais;
- sinalização de atraso ou saída antecipada justificados sem apagar a ocorrência;
- pareamento cronológico de entradas e saídas;
- saldo indisponível enquanto houver par incompleto;
- suporte a jornadas que atravessam a meia-noite;
- janela operacional até seis horas após o término previsto para capturar saída
  e horas adicionais de jornadas noturnas;
- bloco de explicação com previsão, marcações, tolerância, saldo e origem;
- apuração exibida na tela de tratamento de ponto;
- reprocessamento automático por leitura, sem cache ou resultado persistido;
- layout responsivo isolado, preservando a grade existente da tela.

## Regras da versão `attendance-v1`

1. Minutos previstos são a duração entre início e fim menos o intervalo previsto.
2. Horários finais iguais ou anteriores ao início pertencem ao dia seguinte.
3. Minutos trabalhados são a soma dos pares completos de marcações efetivas.
4. Marcações ignoradas não entram na apuração; inclusões e saídas tratadas entram.
5. A tolerância é descontada separadamente do atraso e da saída antecipada.
6. Justificativas identificam a ocorrência como justificada, mas não escondem os
   minutos observados.
7. Saldo é `trabalhado - previsto`; extra e déficit são projeções desse saldo.
8. Com quantidade ímpar de marcações, o saldo, extra e déficit ficam pendentes.
9. Sem jornada de trabalho, os minutos previstos são zero.
10. Nenhum resultado depende de regra mantida apenas na interface.

## Reprocessamento

A apuração não é armazenada. Cada consulta carrega novamente a escala vigente,
exceções, marcações originais e tratamentos. Assim, alterar uma escala ou registrar
um tratamento produz imediatamente um novo resultado usando a mesma versão do
motor e sem manter valores obsoletos.

## Testes cobertos

- jornada completa com intervalo;
- tolerância e atraso justificado;
- pares incompletos;
- jornada com virada de dia;
- recálculo após mudança nas entradas;
- preservação dos testes anteriores do projeto.

## Validação

- `npm run typecheck`;
- `npm test`;
- `npm run lint`;
- `npm run build`.
