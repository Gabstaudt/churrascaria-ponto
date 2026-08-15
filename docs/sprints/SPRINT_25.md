# Sprint 25 — Fundação do REP-P

## Entregas

- domínio de estabelecimento, registrador, configuração e coletor;
- separação explícita entre REP-C e REP-P;
- estabelecimento identificado por CNPJ e timezone, preparado para geofence;
- credencial individual e estado de autorização do coletor;
- `time_entries` compartilhada, com vínculos REP-P e origem preservada;
- sequência NSR única por estabelecimento;
- reserva atômica de NSR dentro da transação da marcação;
- horário oficial exclusivamente do backend;
- serviço `registerRepPPoint` com validação integral;
- endpoint interno autenticado, validado e limitado;
- idempotência por coletor com rollback em disputa concorrente;
- imutabilidade protegida por teste arquitetural;
- auditoria específica de atribuição, criação e rejeição;
- integração source-agnostic com apuração, tratamentos e consultas;
- provisionamento seguro e documentação operacional.

## Fora do escopo

Reconhecimento facial, liveness, geofence, contingência offline, comprovante, AFD,
assinaturas e declaração oficial pertencem às próximas sprints.

## Layout

Não foi criada nova jornada visual. As telas existentes apenas reconhecem o rótulo
REP-P dentro dos mesmos componentes e dimensões, sem alteração de CSS ou layout.
