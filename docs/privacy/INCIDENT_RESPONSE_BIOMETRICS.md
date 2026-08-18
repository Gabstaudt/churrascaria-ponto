# Resposta a incidentes — dados biométricos

| Versão | Data | Responsável | Última revisão |
|---|---|---|---|
| 2026.1 | 2026-08-17 | Equipe de desenvolvimento UpTime | 2026-08-17 (Sprint 33) |

Complementa `docs/operations/INCIDENT_RUNBOOK.md` para os cenários específicos
de dado biométrico (dado pessoal sensível por definição legal). Segue o mesmo
fluxo geral — **detectar → conter → preservar evidências → avaliar impacto →
corrigir → documentar** — com ações específicas por cenário.

## Cenários

### Suspeita de vazamento de template biométrico

1. **Detectar**: acesso ou exportação anômala da tabela `biometric_templates`
   (ex.: dump de banco fora de rotina, credencial de banco comprometida).
2. **Conter**: rotacionar imediatamente as credenciais do PostgreSQL
   atingidas; se a chave de cifra (`BIOMETRIC_ENCRYPTION_KEY`) também for
   suspeita de exposição, tratar como "chave de criptografia comprometida"
   (abaixo) em paralelo.
3. **Preservar evidências**: não apagar linhas da tabela nem da auditoria
   antes de registrar o estado observado.
4. **Avaliar impacto**: mesmo vazado, o template é cifrado — o impacto real
   depende de a chave também ter sido exposta. Sem a chave, o dado exportado
   não é diretamente reversível a um rosto.
5. **Corrigir**: revogar credenciais, revisar controle de acesso ao banco.
6. **Documentar e notificar**: encaminhar ao responsável LGPD para avaliar
   obrigação de comunicação à ANPD e aos titulares, conforme gravidade.

### Chave de criptografia (`BIOMETRIC_ENCRYPTION_KEY`) comprometida

1. **Conter**: gerar nova chave (`openssl rand -base64 32`) e trocar a
   variável de ambiente imediatamente — isso invalida a descriptografia dos
   templates existentes.
2. **Avaliar impacto**: como não há suporte a múltiplas versões de chave
   simultâneas (ver `BIOMETRIC_SECURITY.md`), a troca de chave torna os
   templates cifrados com a chave antiga ilegíveis pelo sistema.
3. **Corrigir**: solicitar recadastro biométrico de todos os funcionários
   ativos após a troca de chave — não há caminho de "reencriptar sem
   recadastrar" na implementação atual.
4. **Documentar**: registrar a rotação, o motivo e a data no procedimento de
   auditoria administrativa; comunicar aos funcionários que um novo cadastro
   será necessário.

### Acesso indevido ao painel administrativo de biometria

1. **Conter**: desativar a conta administrativa envolvida
   (`setEmployeeActive`/inativação de usuário) e revisar `audit_logs` para o
   escopo do acesso (o painel nunca expõe template/score, então o impacto
   máximo é visualização de status/datas de cadastro, não do dado biométrico
   em si).
2. **Avaliar impacto**: como a interface administrativa nunca renderiza
   template ou imagem (confirmado em `BIOMETRIC_SECURITY.md`), esse cenário
   tem impacto limitado por design — ainda assim, deve ser tratado como
   incidente de acesso indevido.
3. **Documentar**: registrar no runbook geral de incidentes.

### Exposição em logs

1. **Conter**: se algum log de aplicação, ferramenta de observabilidade
   externa ou rastreamento de erro (error tracking) mostrar template, imagem,
   embedding ou score — o que a redação automática (`redactAuditPayload`)
   deveria impedir — tratar como falha de controle e revisar imediatamente o
   ponto de código que gerou o log.
2. **Corrigir**: adicionar o campo faltante à lista de bloqueio
   (`src/services/audit-redaction.ts`) e cobrir com teste de regressão antes
   de reabrir o incidente como resolvido.
3. **Preservar evidências**: capturar o log vazado antes de removê-lo da
   ferramenta de observabilidade, para avaliação de impacto.

### Acesso indevido ao Object Storage

Não se aplica hoje — nenhum dado biométrico é gravado no Object Storage (ver
inventário). Manter esta seção para o caso de essa arquitetura mudar no
futuro; qualquer mudança que passe a gravar material biométrico em R2 deve
atualizar este documento antes de ir ao ar.

## Registro do incidente

Todo incidente biométrico, mesmo contido rapidamente, deve gerar um registro
com: horário de detecção, cenário, ações tomadas, impacto avaliado, se houve
dado pessoal efetivamente exposto e a decisão sobre notificação (ANPD e/ou
titulares), conforme `docs/operations/INCIDENT_RUNBOOK.md`.
