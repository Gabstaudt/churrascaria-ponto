# Fundação REP-C — contrato mock

## Limite desta versão

O adapter `MOCK` serve para validar autenticação, transporte, idempotência e
persistência. Ele não lê AFD, não implementa protocolo de fabricante e não deve
ser apresentado como integração REP-C legal. O adapter real depende da escolha
do equipamento e da documentação oficial correspondente.

## Provisionar dispositivo

Primeiro aplique as migrations e defina um pepper com alta entropia:

```bash
openssl rand -hex 32
```

Salve o valor em `REP_CREDENTIAL_PEPPER` e use exatamente o mesmo valor no
servidor. Depois execute:

```bash
REP_DEVICE_NAME="REP Mock Homologação" \
REP_DEVICE_SERIAL="MOCK-001" \
REP_DEVICE_MANUFACTURER="Mock" \
REP_DEVICE_MODEL="Mock v1" \
REP_CREATED_BY_EMAIL="admin@exemplo.com" \
npm run rep:device:create
```

O comando imprime `REP_DEVICE_ID` e `REP_DEVICE_TOKEN` uma única vez. Guarde o
token em cofre de segredos. O banco armazena somente HMAC-SHA256 com pepper; não é
possível recuperar o token original.

## Endpoint

```text
POST /api/rep/sync
Content-Type: application/json
Authorization: Bearer <REP_DEVICE_TOKEN>
X-REP-Device-ID: <REP_DEVICE_ID>
X-Request-ID: <identificador único do lote>
```

Payload mock, limitado a 500 registros e 1 MB:

```json
{
  "version": "mock-v1",
  "records": [
    {
      "nsr": "12345",
      "employeeRegistration": "0001",
      "occurredAt": "2026-08-14T08:00:00-03:00",
      "eventType": "CLOCK"
    }
  ]
}
```

O timestamp exige offset explícito. A matrícula precisa coincidir com
`employees.registration_number`.

## Resposta

```json
{
  "replay": false,
  "syncId": "uuid",
  "status": "PROCESSED",
  "received": 1,
  "inserted": 1,
  "duplicates": 0,
  "rejected": 0,
  "errors": []
}
```

`PARTIAL` indica registros rejeitados, como matrícula desconhecida ou NSR
conflitante dentro do lote. Falhas não incluem dados pessoais nos logs.

## Idempotência

- o mesmo `X-Request-ID` para o mesmo dispositivo retorna o resultado já salvo;
- o mesmo `repDeviceId + NSR` não cria nova marcação, mesmo em outro lote;
- NSRs com zeros à esquerda são normalizados;
- concorrência é protegida pelos índices únicos do PostgreSQL;
- marcações originais são inseridas como `source=REP_C` e não são atualizadas.

## Rate limit

Cada dispositivo pode realizar até 30 requisições por minuto. Excesso retorna
HTTP 429 com `Retry-After`. Esse limite é distribuído pelo PostgreSQL.
