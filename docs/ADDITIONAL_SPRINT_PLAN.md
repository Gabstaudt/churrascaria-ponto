# Plano adicional — REP-P e operação dupla

Este documento estende o planejamento original com as Sprints 25 a 37. Ele é
somente um plano de produto e implementação: sua inclusão não representa código
implementado, conformidade aprovada ou autorização para uso oficial como REP-P.

## Sprint 25 — Fundação do REP-P

**Objetivo:** preparar o sistema para também atuar como registrador eletrônico via
programa.

**Entregáveis principais:**

- módulo específico REP-P;
- cadastro do registrador por estabelecimento;
- identificação do coletor/dispositivo;
- geração de NSR próprio do REP-P;
- sequência unitária por estabelecimento;
- registro original imutável;
- idempotência;
- timestamp oficial do servidor;
- separação clara entre marcação REP-C e REP-P;
- auditoria dos eventos do registrador;
- testes de concorrência do NSR.

**Resultado:** o sistema passa a ter estrutura técnica para criar marcações
oficiais por software, sem interferir no fluxo REP-C existente.

## Sprint 26 — Terminal de Ponto Mobile/Kiosk

**Objetivo:** criar a interface utilizada no celular ou tablet fixo da
churrascaria.

**Entregáveis principais:**

- rota exclusiva de terminal de ponto;
- modo kiosk;
- identificação do terminal autorizado;
- tela de registro extremamente simples;
- relógio visual;
- início do fluxo de identificação;
- status online/offline;
- confirmação de registro;
- bloqueio de navegação administrativa;
- sessão específica do dispositivo;
- atualização automática da aplicação.

**Resultado:** o celular ou tablet passa a funcionar como coletor do REP-P.

## Sprint 27 — Geolocalização e Geofence

**Objetivo:** permitir registros somente dentro da área autorizada da
churrascaria.

**Entregáveis principais:**

- latitude e longitude do estabelecimento;
- raio configurável;
- obtenção da localização no momento da marcação;
- cálculo da distância;
- análise da precisão da localização;
- rejeição fora do raio;
- tratamento de GPS indisponível;
- tratamento de permissão negada;
- registro de evidência da validação;
- identificação de dispositivo não autorizado;
- controles antifraude de localização quando tecnicamente disponíveis.

**Resultado:** uma marcação REP-P só poderá prosseguir quando o terminal estiver
dentro da área permitida.

## Sprint 28 — Reconhecimento Facial e Liveness

**Objetivo:** identificar o funcionário por biometria facial antes do registro.

**Entregáveis principais:**

- cadastro biométrico;
- detecção facial;
- geração de template biométrico;
- armazenamento protegido;
- reconhecimento do funcionário;
- limiar de similaridade;
- liveness ou prova de vida;
- proteção contra foto ou vídeo;
- limite de tentativas;
- auditoria de autenticação;
- controle de acesso aos dados biométricos;
- criptografia.

**Resultado:** o funcionário poderá registrar o ponto olhando para a câmera, com
validação de identidade e prova de vida. A biometria deverá ser tratada como dado
pessoal sensível e receber controles reforçados de LGPD.

## Sprint 29 — Contingência e Antifraude

**Objetivo:** garantir que falhas técnicas não impeçam indevidamente o funcionário
de registrar a jornada.

**Entregáveis principais:**

- segunda tentativa de reconhecimento;
- contingência quando o reconhecimento falhar;
- contingência quando o GPS falhar;
- tratamento de perda de internet;
- fila local de marcações pendentes;
- registro posterior seguro;
- fluxo supervisionado;
- motivo obrigatório;
- auditoria da contingência;
- detecção de replay;
- prevenção de duplicidade;
- detecção de tentativa de fraude com foto ou vídeo;
- proteção contra manipulação de horário;
- bloqueio de dispositivo não autorizado.

**Resultado:** o REP-P continua operacional em situações anormais sem perder
rastreabilidade e sem deixar o empregado sem alternativa de registro.

## Sprint 30 — Comprovante Eletrônico de Registro

**Objetivo:** fornecer o comprovante obrigatório após cada marcação REP-P.

**Entregáveis principais:**

- geração do comprovante após o registro;
- identificação do funcionário;
- CPF ou identificador exigido;
- empregador e estabelecimento;
- data, horário, NSR e tipo da marcação;
- consulta e histórico de comprovantes;
- disponibilização ao trabalhador;
- geração de PDF;
- preparação para assinatura PAdES.

**Resultado:** cada batida REP-P passa a produzir comprovante eletrônico acessível
ao funcionário.

## Sprint 31 — AFD do REP-P

**Objetivo:** implementar o Arquivo Fonte de Dados oficial do registrador próprio.

**Entregáveis principais:**

- gerador de AFD no layout oficial vigente;
- transformação das marcações originais em registros AFD;
- NSR e dados do empregador e trabalhador;
- registros operacionais exigidos;
- validações de formato e CRC quando aplicável;
- testes automatizados;
- exportação controlada e auditada;
- preservação do arquivo gerado.

**Resultado:** o REP-P passa a produzir seu próprio AFD conforme a regulamentação.
O AFD deve nascer do registrador, e não do programa de tratamento.

## Sprint 32 — Assinaturas Digitais e Saídas Oficiais

**Objetivo:** implementar as assinaturas eletrônicas exigidas e validar as saídas
oficiais do sistema.

**Entregáveis principais:**

- `DigitalSignatureService`;
- certificado ICP-Brasil;
- assinatura CAdES do AFD e geração `.p7s`;
- assinatura CAdES do AEJ;
- assinatura PAdES do comprovante PDF;
- armazenamento seguro da chave;
- controle de validade e alerta de expiração do certificado;
- auditoria das assinaturas;
- validação do AEJ e do Espelho de Ponto existentes.

**Resultado:** os documentos oficiais passam a ser produzidos com os padrões de
assinatura necessários: AFD e AEJ com CAdES; comprovante PDF com PAdES.

## Sprint 33 — LGPD Biométrica

**Objetivo:** concluir a camada de privacidade e segurança específica do
reconhecimento facial.

**Entregáveis principais:**

- inventário de dados biométricos;
- definição de finalidade e base legal documentada;
- políticas de retenção e descarte;
- criptografia e controle de acesso;
- logs de acesso à biometria;
- resposta a incidentes;
- política de privacidade e transparência aos funcionários;
- avaliação de impacto ou RIPD;
- processo de exclusão ou atualização biométrica;
- revisão de minimização de dados.

**Resultado:** o reconhecimento facial passa a ter governança própria, separada
das regras comuns do sistema.

## Sprint 34 — Registro no INPI e Documentação REP-P

**Objetivo:** preparar formalmente o software para uso como REP-P.

**Entregáveis principais:**

- preparação da versão candidata e hash do código;
- documentação da versão;
- pedido de registro de programa de computador no INPI;
- organização do certificado emitido;
- identificação oficial da versão do REP-P;
- manuais técnico e operacional;
- documentação de arquitetura e segurança;
- inventário de componentes;
- matriz de requisitos da Portaria 671.

**Resultado:** o software fica formalmente identificado como programa registrado
para utilização como REP-P.

## Sprint 35 — Atestado Técnico e Termo de Responsabilidade

**Objetivo:** produzir a documentação técnica obrigatória do sistema.

**Entregáveis principais:**

- Atestado Técnico e Termo de Responsabilidade;
- identificação da desenvolvedora;
- identificação dos responsáveis legal e técnico;
- versão do software e identificação do REP-P;
- descrição dos requisitos atendidos;
- evidências técnicas;
- assinatura dos responsáveis;
- armazenamento da documentação;
- checklist de conformidade.

**Resultado:** a empresa passa a possuir a documentação técnica necessária para a
utilização do sistema eletrônico.

## Sprint 36 — Piloto REP-P em Campo

**Objetivo:** testar o novo modo de registro em ambiente real sem substituir
imediatamente o processo vigente.

**Entregáveis principais:**

- instalação do celular ou tablet e configuração do modo kiosk;
- cadastro biométrico e configuração do geofence;
- testes de entrada, saída, intervalo e retorno;
- testes de concorrência;
- testes de falha de internet, GPS e reconhecimento facial;
- validação da contingência;
- geração de comprovantes, AFD e AEJ;
- conciliação com o dashboard;
- monitoramento e correção de defeitos.

**Resultado:** funcionamento real do REP-P validado antes da ativação oficial.

## Sprint 37 — Ativação do modo duplo REP-C/REP-P

**Objetivo:** permitir que a plataforma opere oficialmente com qualquer um dos
dois modelos.

**Entregáveis principais:**

- configuração por estabelecimento como `REP_C` ou `REP_P`;
- bloqueios para impedir mistura indevida de origens;
- dashboard indicando o modo ativo;
- regras próprias de importação REP-C e registro REP-P;
- relatórios e fechamento compatíveis com ambos;
- auditoria da mudança de modo;
- documentação operacional;
- testes ponta a ponta nos dois cenários.

**Resultado final:** uma única plataforma com dois modos de origem:

```text
UpTime
├── REP-C
│   └── relógio homologado
└── REP-P
    └── celular ou tablet + reconhecimento facial + geofence
```

Os demais módulos permanecem compartilhados: funcionários, jornadas, escalas,
folgas, faltas, atestados, tratamentos, apuração, banco de horas, fechamento, AEJ,
Espelho de Ponto, auditoria e dashboard.

## Dependências gerais

Antes de considerar qualquer entrega oficial, as especificações e normas vigentes
devem ser novamente verificadas em fontes oficiais e submetidas à validação
técnica, trabalhista, contábil, de segurança e LGPD aplicável. Biometria,
geolocalização, certificados, assinaturas e documentação formal exigem decisões e
evidências externas ao desenvolvimento do código.
