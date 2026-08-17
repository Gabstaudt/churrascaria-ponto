# Inventário de dados biométricos

| Versão | Data | Responsável | Última revisão |
|---|---|---|---|
| 2026.1 | 2026-08-17 | Equipe de desenvolvimento UpTime | 2026-08-17 (Sprint 33) |

Este inventário cobre todo dado relacionado ao reconhecimento facial usado pelo
REP-P, incluindo o que existe fora do banco principal (Object Storage, logs,
backups, fila offline, telemetria). Complementa
[`BIOMETRIC_RETENTION_POLICY.md`](BIOMETRIC_RETENTION_POLICY.md) (prazos),
[`BIOMETRIC_SECURITY.md`](BIOMETRIC_SECURITY.md) (proteção) e
[`BIOMETRIC_RISK_ASSESSMENT.md`](BIOMETRIC_RISK_ASSESSMENT.md) (finalidade e riscos).

## Dados tratados

| Dado | Finalidade | Origem | Armazenamento | Acesso | Retenção | Descarte |
|---|---|---|---|---|---|---|
| Frame JPEG capturado no navegador/terminal | Enrollment ou identificação | Câmera do dispositivo, via `getUserMedia` | Nunca persistido — existe só em memória do processo/requisição (estado React no cliente, `Buffer` no servidor) | Serviço biométrico interno, pelo tempo da requisição | Não se aplica (não persiste) | Descartado automaticamente ao final da requisição/render |
| Template facial (`biometric_templates.encrypted_template`) | Identificação 1:N | Gerado pelo provedor biométrico a partir do frame | PostgreSQL, cifrado com AES-256-GCM (ver `BIOMETRIC_SECURITY.md`) | `BiometricService` no backend; nunca exposto a rotas/telas | Enquanto o perfil estiver `ACTIVE`; versão revogada é apagada após 30 dias (`BIOMETRIC_REVOKED_TEMPLATE_RETENTION_DAYS`) | `DELETE` físico via `npm run biometrics:purge` |
| Perfil biométrico (`employee_biometric_profiles`) | Ciclo de vida e versionamento do cadastro | Ação administrativa de enrollment/revogação | PostgreSQL, sem template | Admin autorizado (`BIOMETRIC_VIEW_STATUS`), somente status/datas/versões | Mantido enquanto o vínculo existir; sempre revogado no desligamento | Não é apagado — é o registro histórico do ciclo de vida (equivalente a um log administrativo) |
| Validação biométrica (`biometric_validations`) | Evidência de cada decisão de autenticação (score, liveness, resultado) | Cada tentativa de marcação no terminal | PostgreSQL, sem imagem nem template | Auditoria e operação REP-P | 180 dias com identificação do funcionário (`BIOMETRIC_VALIDATION_RETENTION_DAYS`); depois disso, anonimizada (campo `employee_id` removido, registro estatístico mantido) | Anonimização automática via `npm run biometrics:purge` |
| Métricas de duração/qualidade (`point_registration_attempts.metrics`) | Diagnóstico de desempenho do reconhecimento | Cada tentativa | PostgreSQL agregado | Administração | Acompanha o ciclo de vida da tentativa | Segue a retenção operacional geral do sistema |
| Eventos de segurança (`security_events.metadata_safe`) | Detecção de ataque (foto/vídeo) | Tentativas com liveness reprovado | PostgreSQL, metadados já sanitizados (`redactAuditPayload`) | Administração/segurança | Segue a política de auditoria geral | Segue a política de auditoria geral |
| Trilha de auditoria (`audit_logs`, ações `BIOMETRIC_*`) | Rastreabilidade de ações administrativas | Enrollment/recadastro/revogação/expurgo | PostgreSQL, com redação automática de campos sensíveis | Administração (auditoria) | Não expira — é a evidência de conformidade | Nunca apagado, mesmo quando o template correspondente é expurgado |
| Object Storage (R2) | — | — | **Não utilizado** — nenhum dado biométrico é gravado no Object Storage; templates ficam só no PostgreSQL | — | — | — |
| Backups do PostgreSQL | Recuperação de desastre | `scripts/backup-database.sh` | Mesmo destino dos backups gerais do banco, portanto inclui os templates cifrados (a cifra permanece nos backups) | Restrito à operação de infraestrutura | Segue a política geral de backup (`docs/operations/BACKUP_RESTORE.md`) — **não há expurgo automático dentro de backups já gerados** | Backups vencidos são descartados conforme a política geral; um expurgo posterior no banco vivo não remove o dado já presente em um backup anterior |
| Fila offline (`offline_point_operations`) | Reenvio de marcações feitas sem conectividade | Terminal em contingência | PostgreSQL — guarda `risk_flags`, nunca imagem/template | Operação REP-P | Acompanha a tentativa/contingência associada | Segue a retenção do fluxo de contingência |
| Cache/telemetria | — | — | **Não há cache de template ou imagem** — telemetria de erro (ver `BIOMETRIC_SECURITY.md`) nunca recebe payload biométrico bruto | — | — | — |

## Minimização (revisão)

Confirmado por revisão de código nesta sprint: o contrato do provedor biométrico
(`src/modules/biometrics/types/index.ts`) só processa `template` (vetor
numérico), `quality`, `liveness` (status/score/riskFlags) e metadados técnicos
de algoritmo/duração. **Não existe, em nenhum ponto do sistema, coleta ou
armazenamento de gênero, idade estimada, emoção, etnia ou qualquer atributo
físico inferido.** O reconhecimento só é acionado após o início explícito de
uma tentativa de marcação; não há vigilância contínua nem captura periódica.

O registro de ciência do aviso de privacidade (`acknowledgedAt` +
`privacyNoticeVersion`) não presume, isoladamente, a base legal do
tratamento — ver a seção de finalidade/base legal em
[`BIOMETRIC_RISK_ASSESSMENT.md`](BIOMETRIC_RISK_ASSESSMENT.md).
