# Sprint 29 — desenho técnico e homologação

## Fila offline

O terminal persiste `PendingPointOperation` em IndexedDB. A fila contém identificadores, ticket HMAC, tipo, horário do dispositivo e última sincronização; não contém imagem, template ou score biométrico. Estados: `PENDING`, `SYNCING`, `ACCEPTED`, `REJECTED`, `REQUIRES_REVIEW`. Evidência só deixa a lista pendente após resposta persistida, mas o histórico local não é apagado imediatamente.

Retries usam 1, 2, 5, 10 e 30 segundos. `operationId` e `Idempotency-Key` impedem NSR duplicado. O backend registra reconciliação individual e é o único emissor de NSR.

O horário offline mantém `capturedAtDevice`, `receivedAtServer`, `lastServerTime`, `lastClockSyncAt` e `clockOffsetMs`. Online, o relógio do backend sempre vence. O uso regulatório do horário corrigido offline deve ser homologado antes da ativação oficial.

## Segurança

Tickets duram no máximo oito horas e vinculam coletor, funcionário, tentativa, GPS e biometria. Reuso com outra chave é replay. Marcações temporalmente próximas são sinalizadas, não removidas. Instâncias simultâneas com a mesma credencial bloqueiam o coletor. Timezone do dispositivo não altera `America/Belem`.

## Testes físicos pendentes

Devem ser executados no estabelecimento: foto impressa, foto em celular/tablet/monitor, vídeo nos mesmos meios, GPS desligado/permissão/timeout/baixa precisão/fora do raio, queda de rede antes e depois do envio, reinício do tablet e backend, terminal bloqueado e concorrência real. Registre resultado, versão, iluminação, equipamento e risk flags. Nenhum resultado físico é presumido neste documento.
