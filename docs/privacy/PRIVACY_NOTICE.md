# Aviso de privacidade — reconhecimento facial no ponto eletrônico

| Versão | Data | Responsável | Última revisão |
|---|---|---|---|
| 2026.1 | 2026-08-17 | Equipe de desenvolvimento UpTime | 2026-08-17 (Sprint 33) |

Este é o texto oficial apresentado ao funcionário no momento do cadastro
biométrico (`src/components/biometrics/biometric-enrollment.tsx`, resumo em
`src/modules/biometrics/privacy-notice.ts`, constante `PRIVACY_NOTICE_VERSION`).
A versão exibida na tela e a registrada em `employee_biometric_profiles.privacy_notice_version`
devem sempre corresponder à versão deste documento.

## O que existe

Este terminal de ponto usa **reconhecimento facial** para confirmar sua
identidade no momento de bater o ponto. Você é informado disso antes do
primeiro cadastro e pode, a qualquer momento, pedir mais detalhes ao setor
responsável.

## Para que serve

Exclusivamente para **confirmar quem está registrando o ponto** — evitar que
uma pessoa registre a entrada ou saída de outra. Não é usado para vigilância
contínua, avaliação de desempenho, emoção, comportamento ou qualquer outra
finalidade.

## Quais dados são processados

- Uma imagem do seu rosto é capturada no momento do cadastro ou da marcação.
- Essa imagem **nunca é guardada** — ela existe só durante o processamento e é
  descartada assim que o sistema extrai dela um "template" (uma representação
  matemática do rosto, não uma foto).
- O template é o único dado biométrico armazenado, e sempre de forma cifrada.
- Não coletamos idade, gênero, emoção, etnia ou qualquer outra característica
  além do necessário para identificação.

## Como são protegidos

- O template é cifrado com um algoritmo forte (AES-256-GCM) antes de ser
  salvo; mesmo quem acessa o banco de dados diretamente não vê o template em
  texto legível.
- Apenas administradores autorizados podem ver o **status** do seu cadastro
  (ativo, revogado, data do cadastro) — nunca o template, a imagem ou uma
  pontuação de reconhecimento.
- Toda ação administrativa sobre seu cadastro biométrico (cadastro, recadastro,
  revogação) fica registrada em uma trilha de auditoria.

Detalhes técnicos completos em [`BIOMETRIC_SECURITY.md`](BIOMETRIC_SECURITY.md).

## Por quanto tempo seus dados ficam guardados

- O template fica ativo enquanto seu cadastro biométrico estiver em uso.
- Quando um cadastro é revogado (por sua solicitação, por recadastro ou por
  desligamento), o template é apagado definitivamente em até 30 dias.
- Ao ser desligado da empresa, seu cadastro biométrico é revogado
  automaticamente e você deixa de conseguir usar o reconhecimento facial.
- Registros de tentativas de marcação (sem imagem, sem template) são mantidos
  por até 180 dias vinculados a você; depois disso, deixam de estar associados
  ao seu nome.

Detalhes completos em [`BIOMETRIC_RETENTION_POLICY.md`](BIOMETRIC_RETENTION_POLICY.md).

## Contingência

Se o reconhecimento facial estiver indisponível ou falhar, existe um fluxo de
contingência supervisionado para que sua marcação de ponto não fique
impedida — a indisponibilidade do reconhecimento nunca bloqueia
definitivamente o seu registro de ponto.

## Seus direitos e canais de contato

Você pode, a qualquer momento:

- pedir para ver o status do seu cadastro biométrico;
- pedir a exclusão antecipada do seu template (sem esperar os prazos automáticos acima);
- pedir o recadastro, caso o reconhecimento não esteja funcionando bem para você;
- tirar dúvidas sobre como seus dados biométricos são usados e protegidos.

Solicitações devem ser encaminhadas ao setor de Recursos Humanos ou ao
responsável administrativo da empresa, que acionará a equipe técnica quando
necessário.

## Consentimento e base legal

A ciência deste aviso (registrada como `acknowledgedAt` no seu cadastro) é
condição para o uso do reconhecimento facial, mas **não é, isoladamente, a
base legal do tratamento** perante a LGPD — a definição formal da base legal
aplicável ao contexto trabalhista é responsabilidade jurídica da empresa, não
uma decisão técnica deste sistema. Ver
[`BIOMETRIC_RISK_ASSESSMENT.md`](BIOMETRIC_RISK_ASSESSMENT.md).
