# ADR-007 — Falhas técnicas e rejeições antifraude têm tratamentos distintos

`ContingencyPolicyService` é a única fonte de decisão. Os resultados são:

- `TECHNICAL_FAILURE`: recuperação, fila offline ou supervisão;
- `VALIDATION_REJECTED`: rejeição; fora do geofence não abre atalho;
- `SECURITY_REJECTION`: bloqueio/auditoria; liveness, foto, vídeo, replay e possível clonagem não abrem contingência automática.

Eventos de segurança usam linguagem `SUSPICIOUS` ou `SECURITY_REJECTION`. A conclusão sobre fraude depende de investigação humana.
