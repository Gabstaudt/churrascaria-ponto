# Segurança dos dados biométricos

| Versão | Data | Responsável | Última revisão |
|---|---|---|---|
| 2026.1 | 2026-08-17 | Equipe de desenvolvimento UpTime | 2026-08-17 (Sprint 33) |

Revisão técnica dos controles de segurança que protegem o template biométrico
e as decisões de autenticação, complementando a arquitetura descrita em
[`ADR-005`](../adr/ADR-005-biometrics-authentication-not-time-entry.md).

## Criptografia do template

- Algoritmo: **AES-256-GCM**, IV aleatório de 12 bytes por operação, tag de
  autenticação verificada na descriptografia (`src/modules/biometrics/services/biometric-encryption.service.ts`).
- Chave: `BIOMETRIC_ENCRYPTION_KEY` (32 bytes em Base64), fornecida somente por
  variável de ambiente — nunca commitada, nunca em `NEXT_PUBLIC_`, nunca
  enviada ao navegador. Ausência ou tamanho incorreto da chave falha
  explicitamente (`BIOMETRIC_ENCRYPTION_KEY não configurada` /
  `deve possuir 32 bytes em Base64`), sem expor o valor recebido.
- Acesso direto ao PostgreSQL (`psql`, dump, `db:studio`) mostra apenas o
  blob cifrado em `biometric_templates.encrypted_template` — nunca o vetor em
  texto puro.
- Cada ambiente (desenvolvimento, homologação, produção) deve usar uma chave
  própria e independente. Isso é disciplina operacional de implantação (o
  código não impede reuso de chave entre ambientes); ver checklist de
  implantação em `docs/operations/DEPLOYMENT.md`.

### Limitações conhecidas

- **Sem KMS/gerenciador de segredos dedicado** — a chave vive apenas como
  variável de ambiente do processo. Rotação de chave, se necessária, requer
  reprocessar (recadastrar) todos os templates existentes, pois não há
  suporte a múltiplas versões de chave simultâneas (só existe a versão de
  formato `aes-256-gcm-v1`, não uma versão de *chave*). Migrar para um
  gerenciador de segredos com suporte a rotação é um item de evolução, não
  coberto nesta sprint.
- **Provedor biométrico externo**: o template é gerado por um serviço Python
  interno, acessado só com token (`BIOMETRIC_PROVIDER_TOKEN`), nunca por
  sessão de usuário comum (`ADR-005`).

## Controle de acesso

Permissões dedicadas (`src/modules/biometrics/services/biometric-permission.service.ts`):

```text
BIOMETRIC_ENROLL
BIOMETRIC_REVOKE
BIOMETRIC_REENROLL
BIOMETRIC_VIEW_STATUS
PRIVACY_ADMIN
```

Hoje todas mapeiam para o mesmo papel `ADMIN` (o sistema não tem um modelo de
RBAC mais granular em nenhum outro módulo) — mas a separação de nomes já
existe e é aplicada nas páginas e ações administrativas, preparando o terreno
para diferenciar quem pode só *ver* status de quem pode *cadastrar* ou
*revogar*, sem exigir refatoração das rotas quando essa granularidade for
necessária. Funcionário comum e credencial de terminal/coletor nunca alcançam
essas rotas — elas exigem sessão administrativa, não a credencial do
dispositivo usada pelo terminal de ponto.

A interface administrativa (`/admin/biometria`, `/admin/funcionarios/[id]/biometria`)
nunca renderiza template, embedding, score ou imagem — confirmado por revisão
de código nesta sprint: as consultas dessas páginas nunca selecionam a coluna
`encrypted_template`.

## Auditoria e logs

- `recordAudit` (usado pelo enrollment/revogação) já passa todo payload por
  `redactAuditPayload`, que remove automaticamente qualquer campo cujo nome
  contenha `biometric`, `template`, `embedding`, `image`, `frame`, `selfie`,
  `livenessscore` ou `similarityscore`.
- Nesta sprint, essa mesma redação foi estendida para os dois caminhos que
  antes não passavam por nenhum filtro: `recordRepPEvent` (eventos de
  autenticação no terminal) e o insert em `security_events.metadata_safe`
  (eventos de antifraude). Antes, esses caminhos eram seguros apenas por
  convenção dos chamadores atuais nunca incluírem dado sensível — agora há uma
  barreira estrutural contra uma regressão futura.
- Varredura de código confirma: não há `console.log`/`console.error` em
  nenhum caminho do módulo de biometria, nem em rotas do terminal.

## Eventos auditados

```text
BIOMETRIC_ENROLLED
BIOMETRIC_REENROLLED
BIOMETRIC_REVOKED
BIOMETRIC_DELETED
```

Todos guardam apenas `employeeId`, responsável, timestamp, ação e resultado —
nunca template, imagem ou embedding.
