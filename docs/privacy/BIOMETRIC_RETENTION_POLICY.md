# Política de retenção e descarte — dados biométricos

| Versão | Data | Responsável | Última revisão |
|---|---|---|---|
| 2026.1 | 2026-08-17 | Equipe de desenvolvimento UpTime | 2026-08-17 (Sprint 33) |

Implementada em `src/modules/biometrics/policy/biometric-retention-policy.ts`
e aplicada por `src/modules/biometrics/services/biometric-retention.service.ts`
(`npm run biometrics:purge`). Não existe uma regra única de retenção para
todos os dados biométricos — cada categoria tem prazo e ação de descarte
próprios, conforme a natureza e a sensibilidade do dado.

## Categorias e prazos

| Categoria | Condição de início | Prazo | Ação ao final do prazo | Configuração |
|---|---|---|---|---|
| Frame/imagem temporária | — | Não se aplica | Nunca persistida (existe só em memória da requisição) | — |
| Template biométrico (`biometric_templates`) enquanto ativo | Perfil `ACTIVE` | Enquanto necessário para autenticação | Nenhuma — segue o ciclo de vida do vínculo | — |
| Template biométrico revogado | `revoked_at` preenchido (revogação manual, recadastro ou desligamento) | 30 dias | `DELETE` físico da linha (a cifra deixa de existir) | `BIOMETRIC_REVOKED_TEMPLATE_RETENTION_DAYS` (padrão `30`) |
| Perfil biométrico (`employee_biometric_profiles`) | — | Sem prazo de apagamento — é o registro do ciclo de vida, sem material biométrico | Mantido indefinidamente (não contém template) | — |
| Validação biométrica (`biometric_validations`) | `created_at` | 180 dias | Anonimização: `employee_id` é definido como nulo, preservando score/liveness/riscos como evidência estatística sem vínculo pessoal | `BIOMETRIC_VALIDATION_RETENTION_DAYS` (padrão `180`) |
| Trilha de auditoria (`audit_logs`, eventos `BIOMETRIC_*`) | — | Não expira | Nunca apagada — é a evidência de que uma operação (inclusive um expurgo) ocorreu | — |
| Backups já gerados | — | Segue `docs/operations/BACKUP_RESTORE.md` | O expurgo no banco vivo não alcança backups anteriores; backups vencidos seguem a rotação geral | — |

## Por que prazos diferentes

- **Template ativo** precisa existir enquanto o funcionário usa o reconhecimento
  facial — é o dado funcionalmente necessário.
- **Template revogado** só existiria por inércia depois de revogado; 30 dias é
  uma janela de seguranca operacional (permitir reverter um erro humano antes
  do apagamento físico), não um prazo indefinido.
- **Validações** têm menor sensibilidade individual (não reconstroem o rosto),
  mas ainda são dado pessoal enquanto vinculadas a um funcionário; 180 dias
  cobre o ciclo típico de auditoria trabalhista/contábil sem reter o vínculo
  pessoal indefinidamente.
- **Perfil e auditoria** não contêm material biométrico reconstituível — mantê-los
  serve à própria comprovação de conformidade (quem, quando, por quê).

Os prazos acima são o ponto de partida técnico desta sprint. Como registrado em
`BIOMETRIC_RISK_ASSESSMENT.md`, a validação jurídica formal desses períodos
(inclusive frente a obrigações trabalhistas de guarda de registros) é
responsabilidade do jurídico/contábil da empresa, não uma decisão exclusivamente
técnica.

## Execução

```bash
npm run biometrics:purge
```

Idempotente e seguro para reexecução. Deve ser agendado externamente (crontab,
systemd timer ou equivalente do provedor de hospedagem) — o projeto não roda
jobs em processo, seguindo o mesmo padrão de `receipts:recover` e `rep:monitor`
(ver `docs/operations/`). Sugestão: diária, fora do horário de pico.

Quando executado com um responsável identificado (uso administrativo pontual,
fora do script agendado), o expurgo audita `BIOMETRIC_DELETED` com a contagem
de linhas afetadas — nunca com os dados em si.

## Exclusão e atualização sob demanda

Além do expurgo por prazo, um funcionário (ou responsável legal) pode solicitar
a qualquer momento:

- **Revisão do cadastro**: consulta ao status via `/admin/funcionarios/[id]/biometria`
  (sem exposição de template).
- **Recadastro**: substitui o template anterior, que é revogado imediatamente e
  segue o prazo de 30 dias acima.
- **Exclusão antecipada**: revogação manual (`Revogar biometria`) seguida, se
  desejado, de execução pontual do expurgo — não é necessário aguardar os 30
  dias padrão quando há pedido explícito do titular.

Canal para dúvidas e solicitações: ver `PRIVACY_NOTICE.md`.
