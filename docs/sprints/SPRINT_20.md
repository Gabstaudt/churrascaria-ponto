# Sprint 20 — Fundação da Integração REP-C

## Entregas

- contrato `REPAdapter` independente de fabricante;
- adapter `MOCK` versionado e estritamente validado;
- tabelas `rep_devices`, `rep_sync_logs` e `rep_time_records`;
- migration `0015_high_human_fly.sql`;
- provisionamento de dispositivo por comando administrativo;
- token aleatório de 256 bits exibido uma única vez;
- armazenamento de credencial por HMAC-SHA256 com pepper externo ao banco;
- endpoint `POST /api/rep/sync` sem sessão de usuário comum;
- autenticação por dispositivo e comparação constante da credencial;
- payload limitado a 1 MB e 500 registros;
- rate limit distribuído de 30 lotes por minuto por dispositivo;
- idempotência por request e por `repDeviceId + NSR`;
- normalização de NSR com zeros à esquerda;
- importação imutável em `time_entries` com origem `REP_C`;
- logs estruturados sem credencial ou dados pessoais;
- testes de contrato, reenvio, conflito, identidade por dispositivo e credencial.

## Layout

Esta sprint não adiciona telas nem altera navegação ou CSS. A fundação foi mantida
fora das jornadas visuais para preservar integralmente o layout existente.

## Dependência externa

O fabricante, modelo, protocolo e layout AFD ainda precisam ser definidos. O mock
não representa conformidade legal. A implementação do adapter real pertence à
Sprint 21 depois do recebimento da documentação oficial do equipamento.
