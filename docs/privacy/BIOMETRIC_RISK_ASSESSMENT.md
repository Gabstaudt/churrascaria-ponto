# Avaliação de riscos e preparação de RIPD — reconhecimento facial

| Versão | Data | Responsável | Última revisão |
|---|---|---|---|
| 2026.1 | 2026-08-17 | Equipe de desenvolvimento UpTime | 2026-08-17 (Sprint 33) |

Este documento reúne os elementos técnicos de um Relatório de Impacto à
Proteção de Dados (RIPD) para o tratamento biométrico do REP-P: finalidade,
necessidade, proporcionalidade, alternativas consideradas e matriz de riscos.
**Não substitui a validação formal por responsável jurídico/contábil ou
profissional de privacidade especializado** — é o insumo técnico para essa
validação, não a decisão final sobre base legal ou adequação normativa.

## Finalidade

Confirmar a identidade do funcionário no momento do registro de ponto,
impedindo que uma pessoa registre a jornada de outra ("marcação por
interposta pessoa"). É um controle de integridade do registro de ponto, não
uma ferramenta de vigilância, avaliação comportamental ou controle de
produtividade.

## Necessidade

A alternativa anterior (cartão/senha) não impede compartilhamento de
credencial entre funcionários. O reconhecimento facial, combinado com prova
de vida (liveness), é o controle disponível que vincula a marcação a uma
pessoa fisicamente presente no momento do registro — sem essa camada, a
integridade do próprio registro de ponto (topo da lista de prioridades do
projeto, ver `docs/PROJECT_CONTEXT.md`) fica mais vulnerável a fraude.

## Proporcionalidade

- **Dado mínimo necessário**: um template matemático, não a imagem facial em
  si (a imagem nunca é retida — ver inventário).
- **Uso pontual, não contínuo**: a câmera só é ativada durante uma tentativa
  explícita de marcação, nunca em vigilância passiva.
- **Sem inferência de atributos sensíveis adicionais**: nenhuma emoção, idade,
  gênero ou etnia é processada (ver revisão de minimização no inventário).
- **Contingência sempre disponível**: a indisponibilidade do reconhecimento
  nunca impede a marcação (Sprint 29), evitando que a exigência biométrica se
  torne uma barreira desproporcional ao direito de registrar a jornada.

## Alternativas consideradas

| Alternativa | Por que não substitui o reconhecimento facial isoladamente |
|---|---|
| Senha/PIN | Compartilhável entre funcionários; não vincula a marcação a uma pessoa fisicamente presente |
| Cartão/crachá | Emprestável; mesmo problema de vínculo pessoal |
| Biometria digital (impressão digital) | Também seria dado biométrico sensível, com custo de hardware adicional e sem vantagem clara de proporcionalidade sobre a solução facial já adotada |
| Supervisão humana constante | Inviável operacionalmente para o porte da churrascaria |

## Matriz de riscos

| Risco | Probabilidade | Impacto | Controle existente | Risco residual | Ação necessária |
|---|---|---|---|---|---|
| Vazamento de template biométrico | Baixa | Alto | Criptografia AES-256-GCM; template nunca trafega para o frontend; sem Object Storage envolvido | Baixo-médio (chave sem KMS dedicado) | Avaliar gerenciador de segredos com rotação de chave (ver `BIOMETRIC_SECURITY.md`) |
| Acesso indevido (interno) ao cadastro biométrico | Baixa | Médio | Permissões dedicadas (`BIOMETRIC_*`), interface nunca expõe template/score, auditoria de toda ação | Baixo | Diferenciar granularidade de permissão (view vs. enroll vs. revoke) quando o modelo de RBAC do projeto evoluir |
| Uso fora da finalidade definida (ex.: vigilância, avaliação comportamental) | Baixa | Alto | Arquitetura só aciona câmera em tentativa explícita de marcação; nenhum dado comportamental é coletado ou armazenado | Baixo | Reforçar no treinamento administrativo que a biometria não pode ser reaproveitada para outros fins |
| Falso reconhecimento (aceitar a pessoa errada) | Média | Alto | Limiar de similaridade configurável, distância mínima entre primeiro/segundo candidato, liveness obrigatório | Médio (limiares ainda não calibrados com hardware/modelo definitivos, conforme `ADR-005`) | Calibração formal do limiar com o equipamento e a base de usuários reais antes de produção |
| Indisponibilidade do serviço biométrico | Média | Médio | Fluxo de contingência supervisionado (Sprint 29) impede bloqueio da marcação | Baixo | — |
| Exposição de dado biométrico em logs/auditoria | Baixa | Alto | Redação automática (`redactAuditPayload`), agora aplicada também a `recordRepPEvent`/`security_events`; nenhum `console.log` no caminho biométrico | Baixo | Manter teste de regressão que varre por vazamento (ver `BIOMETRIC_SECURITY.md` e testes de privacidade) |
| Comprometimento do dispositivo/terminal | Baixa | Médio | Terminal nunca decide funcionário/score/resultado — decisão sempre no backend; credencial de dispositivo própria, não sessão de usuário | Baixo-médio | Rotação de credencial do coletor conforme `docs/operations/` |
| Uso após desligamento do funcionário | Baixa (mitigada nesta sprint) | Alto | Revogação automática no desligamento (Sprint 33) + filtro de status de funcionário na identificação 1:N (dupla proteção) | Baixo | — |

## Encaminhamento

Este documento deve ser levado ao responsável jurídico/contábil da empresa
para: (a) validar formalmente a base legal do tratamento biométrico no
contexto trabalhista; (b) confirmar se os prazos de retenção definidos em
`BIOMETRIC_RETENTION_POLICY.md` atendem obrigações de guarda de registros
trabalhistas; (c) decidir se um RIPD formal (nos termos exigidos pela
ANPD/legislação aplicável) precisa ser produzido a partir deste insumo.
