# Sprint 21 — Ponto Sync e adapter do fabricante

## Entregas concluídas

- agente local Ponto Sync executável em processo contínuo;
- contrato versionado `PONTO_SYNC_V1` entre agente e API;
- consulta incremental após o último NSR confirmado;
- fila local durável com gravação atômica;
- retry exponencial com jitter e limite de cinco minutos;
- retomada automática após queda ou reinício;
- request ID estável e integração com a idempotência da Sprint 20;
- diagnóstico sem dados sensíveis;
- template de serviço systemd com hardening;
- instalação por releases e rollback sem apagar a fila;
- adapter de fixture e testes para homologação.

## Dependência externa pendente

O adapter do fabricante não foi inventado. Para concluí-lo são obrigatórios:
fabricante, modelo exato, versão de firmware, método de acesso, SDK/protocolo e
documentação oficial. O aceite em equipamento real só pode ocorrer após essa
entrada e pertence ao restante desta sprint antes do piloto da Sprint 22.

## Layout

Nenhuma tela, folha de estilo, componente visual ou navegação foi alterada.
