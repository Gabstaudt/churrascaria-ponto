# Runbook — comprovantes eletrônicos

## Configuração

1. Configure o PostgreSQL e o storage privado R2 já usados pelo projeto.
2. Defina `RECEIPT_VERIFICATION_SECRET` com pelo menos 32 caracteres. Em desenvolvimento, `BETTER_AUTH_SECRET` é aceito como fallback.
3. Execute `npm run db:migrate` para criar `point_receipts`.

## Operação

- Diagnóstico sem alterações: `npm run receipts:reconcile`
- Reparar marcações sem comprovante: `npm run receipts:reconcile -- --repair`
- Reprocessar a fila vencida: `npm run receipts:recover`
- Limites opcionais: `RECEIPT_RECONCILIATION_LIMIT` e `RECEIPT_RECOVERY_LIMIT`.

O reprocessamento é seguro para repetição: a chave única `(time_entry_id, format_version)` evita comprovantes duplicados.

## Investigação

Consulte o painel **Administração → Comprovantes** e a auditoria REP-P. Os códigos de erro armazenados são sanitizados. Em divergência de hash, o download é bloqueado e `POINT_RECEIPT_INTEGRITY_MISMATCH` é gravado.

Se o status chegar a `REQUIRES_ATTENTION`, verifique credenciais e disponibilidade do R2 antes de reprocessar. Nunca apague ou altere a marcação para corrigir um comprovante.

## Alertas recomendados

- qualquer `MARKING_WITHOUT_RECEIPT`;
- aumento de `POINT_RECEIPT_GENERATION_FAILED`;
- qualquer `POINT_RECEIPT_INTEGRITY_MISMATCH`;
- comprovantes em `PENDING` ou `FAILED` além da janela operacional definida.
