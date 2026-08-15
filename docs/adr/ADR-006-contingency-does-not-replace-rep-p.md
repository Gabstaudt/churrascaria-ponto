# ADR-006 — Contingência não substitui o fluxo normal REP-P

## Decisão

O fluxo normal continua sendo terminal autorizado, geofence, biometria, liveness e registro oficial. Contingência somente nasce após falha técnica classificada ou liberação administrativa. Rejeições de validação e segurança não são convertidas automaticamente em contingência.

Uma marcação supervisionada é criada pelo mesmo serviço REP-P, recebe NSR exclusivamente no backend, permanece original e imutável e referencia seu evento de contingência. Qualquer correção posterior usa `timeAdjustment`.

## Consequências

- `authenticationMethod=CONTINGENCY` nunca aparece como biometria aprovada.
- motivo técnico, observação, autorizador, terminal e horários permanecem auditáveis;
- administradores não podem aprovar a própria contingência quando vinculados ao funcionário;
- URL pública, matrícula isolada ou escolha de nome não autorizam marcação.
