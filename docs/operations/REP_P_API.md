# API interna REP-P — Sprint 25

Esta fundação permite marcações de teste pelo backend. Ainda não inclui terminal,
reconhecimento facial, liveness ou geofence e não deve ser apresentada como REP-P
oficial antes das sprints de conformidade, assinaturas, INPI e piloto.

## Provisionamento

Defina as variáveis de estabelecimento, registrador, coletor, administrador e
`REP_CREDENTIAL_PEPPER`, então execute `npm run rep-p:provision`. O token do coletor
é exibido uma única vez; somente seu HMAC é persistido.

## Registro

`POST /api/rep-p/entries`, com `application/json` e cabeçalhos:

- `Authorization: Bearer <token>`;
- `X-REP-P-Collector-ID: <uuid>`;
- `Idempotency-Key: <16 a 100 caracteres>`.

Payload estrito:

```json
{ "employeeId": "uuid", "eventType": "CLOCK_IN" }
```

O cliente não envia horário, NSR, registrador ou estabelecimento. O backend valida
toda a cadeia, usa seu relógio, reserva o NSR atomicamente e persiste a marcação em
`time_entries`. Primeiro processamento retorna `201`; replay equivalente retorna
`200` e `replay: true`. Reutilizar a chave com outra operação é rejeitado.

## Segurança

O endpoint limita payload a 16 KiB e 30 solicitações por minuto por coletor. Não
usa sessão de usuário, rejeita coletor inativo/bloqueado e não registra token nos
logs ou auditoria.
