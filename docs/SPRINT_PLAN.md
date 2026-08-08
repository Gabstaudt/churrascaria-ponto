# Plano completo de sprints

Roadmap do **Sistema de Ponto Eletrônico — Churrascaria Marituba**, derivado de
`docs/PROJECT_CONTEXT.md`.

## Premissas de planejamento

- Cadência padrão: sprints de duas semanas.
- Estimativa-base: equipe pequena, com uma frente principal de desenvolvimento.
- Horizonte: 24 sprints, aproximadamente 48 semanas.
- Cada sprint entrega uma parte utilizável, testada e demonstrável.
- O escopo de uma sprint pode ser redistribuído depois de medir a velocidade real
  da equipe, sem alterar a ordem das dependências.
- Compra do REP-C, acesso ao ambiente da churrascaria, credenciais de
  infraestrutura e validação contábil/jurídica são dependências externas.

## Definition of Done

Uma história só é considerada concluída quando:

- critérios de aceite e regras de autorização foram atendidos;
- entradas externas possuem validação Zod no servidor;
- migrations foram geradas e revisadas quando o banco mudou;
- testes relevantes foram adicionados e executados;
- lint, TypeScript e build passam;
- erros não expõem dados internos e ações sensíveis geram auditoria;
- interface funciona em mobile e desktop e está em português do Brasil;
- documentação e `.env.example` foram atualizados quando necessário;
- houve revisão manual do fluxo principal em ambiente de homologação.

## Visão das entregas

| Marco | Sprints | Resultado |
| --- | --- | --- |
| Fundação técnica | 1–2 | Banco, autenticação e painel protegido |
| MVP de funcionários | 3–4 | Primeiro marco funcional completo |
| Planejamento de jornada | 5–7 | Jornadas, escalas, folgas e afastamentos |
| Ponto e tratamento | 8–12 | Marcações, situação diária, ajustes e faltas |
| Documentos e cálculos | 13–16 | Atestados, cálculos e banco de horas |
| Operação e relatórios | 17–19 | Portal, fechamento, relatórios e produção inicial |
| Integração REP-C | 20–22 | API, adapter, Ponto Sync e piloto real |
| Conformidade e lançamento | 23–24 | Saídas oficiais validadas e produção final |

## Sprint 1 — Fundação de dados

**Objetivo:** estabelecer PostgreSQL e Drizzle com isolamento no servidor.

**Entregáveis:**

- estrutura modular inicial em `src/`;
- `drizzle.config`, conexão via `DATABASE_URL` e scripts de banco;
- schemas iniciais de `users` e `employees`;
- enums de role e status, índices e unicidade de email, CPF e matrícula;
- primeira migration revisada;
- `.env.example` e instruções locais;
- testes das validações básicas de CPF e funcionário.

**Aceite:** migration aplica em banco vazio; conexão não entra no bundle cliente;
lint, TypeScript e build passam.

## Sprint 2 — Autenticação e painel protegido

**Objetivo:** permitir acesso administrativo seguro.

**Entregáveis:**

- Better Auth configurado e senhas armazenadas com hash;
- seed/comando seguro para criar o primeiro admin local;
- login, logout, sessão e recuperação de estado autenticado;
- proteção de `/admin` no servidor e autorização inicial por role;
- layout administrativo responsivo com navegação básica;
- estados de erro e auditoria inicial de acesso relevante.

**Aceite:** visitante não acessa o painel; usuário inativo não autentica; admin
entra e sai com sessão segura.

## Sprint 3 — Funcionários: cadastro e listagem

**Objetivo:** iniciar o primeiro módulo de negócio.

**Entregáveis:**

- service e endpoints/actions de funcionários;
- listagem com busca, paginação, filtros e status;
- formulário de cadastro com CPF, telefone e datas normalizados;
- mensagens amigáveis para CPF e matrícula duplicados;
- componentes compartilhados que já tenham reuso real;
- auditoria de criação.

**Aceite:** admin cadastra e encontra um funcionário; validação ocorre também no
servidor; duplicidades são impedidas pelo domínio e pelo banco.

## Sprint 4 — Funcionários: detalhe, edição e status

**Objetivo:** concluir o primeiro marco funcional.

**Entregáveis:**

- página de detalhes e histórico administrativo;
- edição controlada dos dados cadastrais;
- inativação e reativação sem exclusão física;
- tratamento dos status `ACTIVE`, `VACATION`, `LEAVE`, `TERMINATED` e `INACTIVE`;
- autorização e auditoria com estado anterior/posterior;
- testes do service e dos fluxos críticos.

**Aceite:** login → painel → listar → cadastrar → visualizar → editar → inativar
→ reativar funciona com banco real. Este é o MVP 1.

## Sprint 5 — Jornadas com vigência

**Objetivo:** modelar jornadas sem destruir histórico.

**Entregáveis:**

- `workSchedules` e `scheduleDays` com migrations;
- dias da semana, entrada, saída, intervalo e tolerância;
- vigência com início e fim e validação de sobreposição;
- cadastro, visualização e edição por criação de nova vigência;
- service dedicado e auditoria;
- testes de intervalos, horários e vigências.

**Aceite:** um funcionário pode ter horários diferentes por dia e alterações
futuras não sobrescrevem a jornada histórica.

## Sprint 6 — Escalas e visão de calendário

**Objetivo:** transformar jornada padrão em planejamento operacional.

**Entregáveis:**

- modelo de turnos/escala e exceções por data;
- visões diária, semanal e mensal, começando pela experiência de maior uso;
- geração/consulta da escala prevista a partir da jornada vigente;
- ajustes excepcionais com responsável e motivo;
- filtros por funcionário, cargo e situação;
- auditoria e testes de resolução da escala aplicável.

**Aceite:** para qualquer data, o sistema determina e exibe a previsão válida de
trabalho do funcionário.

## Sprint 7 — Folgas, trocas, férias e afastamentos

**Objetivo:** representar exceções de disponibilidade com histórico.

**Entregáveis:**

- `daysOff`, `dayOffSwaps`, `vacations` e `leavePeriods` conforme necessidade;
- cadastro e alteração de folga com motivo e autorizador;
- fluxo de solicitação/aprovação de troca de folga;
- períodos de férias e afastamentos;
- prevenção de conflitos de período;
- reflexo automático na escala e auditoria completa.

**Aceite:** a situação planejada do dia distingue trabalho, folga, férias e
afastamento, mantendo o histórico das mudanças.

## Sprint 8 — Marcações originais simuladas

**Objetivo:** criar o núcleo imutável das marcações antes do hardware.

**Entregáveis:**

- `timeEntries` com origem, horário oficial, identificadores externos e metadata;
- restrições que impedem duplicidade;
- importador/gerador controlado de dados simulados para desenvolvimento;
- listagem cronológica e filtros;
- ausência de operações administrativas comuns de update/delete;
- testes de imutabilidade e idempotência.

**Aceite:** uma marcação original pode ser inserida uma vez e consultada, mas não
editada ou apagada pelos fluxos normais.

## Sprint 9 — Situação diária e dashboard operacional

**Objetivo:** comparar escala prevista com marcações reais.

**Entregáveis:**

- service de apuração diária inicial;
- pareamento seguro de entradas/saídas sem alterar originais;
- identificação de registros incompletos e possível ausência;
- dashboard com ativos, presentes, atrasados, ausentes, folgas e pendências;
- tabela diária com previsão, realizado e status;
- testes de virada de dia e timezone `America/Belem`.

**Aceite:** o administrador consulta um dia e entende quem deveria trabalhar, as
marcações existentes e quais casos precisam de revisão.

## Sprint 10 — Tratamentos de ponto

**Objetivo:** corrigir ocorrências preservando o registro original.

**Entregáveis:**

- `timeAdjustments` e tipos iniciais de tratamento;
- inclusão de marcação faltante e desconsideração lógica de marcação indevida;
- saída esquecida, atraso justificado e saída antecipada;
- motivo obrigatório, responsável, data e vínculo com funcionário/dia;
- visualização conjunta de original, tratamento e histórico;
- testes que comprovem que tratamentos não alteram `timeEntries`.

**Aceite:** o administrador resolve uma marcação incompleta e o sistema mantém
lado a lado o original imutável e o tratamento auditável.

## Sprint 11 — Faltas e justificativas

**Objetivo:** transformar possíveis ausências em decisões administrativas.

**Entregáveis:**

- `absences` e `absenceJustifications`;
- fila de `POSSIBLE_ABSENCE` sem classificação definitiva automática;
- decisões `UNJUSTIFIED`, `JUSTIFIED`, `MEDICAL_CERTIFICATE`, `DAY_OFF`,
  `VACATION`, `LEAVE`, `TIME_ENTRY_ERROR` e `OTHER`;
- motivo, aprovador, anexos futuros e histórico;
- atualização da situação diária e auditoria.

**Aceite:** ausência ambígua permanece pendente até decisão autorizada e toda
classificação pode ser explicada pelo histórico.

## Sprint 12 — Auditoria administrativa completa

**Objetivo:** consolidar rastreabilidade antes de ampliar o domínio.

**Entregáveis:**

- `auditLogs` padronizado para todas as ações relevantes já existentes;
- serviço transversal de auditoria com transação quando necessário;
- consulta com filtros por responsável, entidade, ação e período;
- visualização segura de antes/depois;
- política de ocultação de senha, token, CPF e outros campos sensíveis;
- testes de autorização e não vazamento.

**Aceite:** alterações de funcionário, jornada, escala, folga, ausência e ponto
possuem trilha persistente consultável por admin.

## Sprint 13 — Atestados e Object Storage

**Objetivo:** receber documentos médicos com acesso restrito.

**Entregáveis:**

- `medicalCertificates` com período, descrição mínima e `fileKey`;
- integração com Cloudflare R2 por service isolado;
- upload validado por tipo e tamanho, download autorizado e URL temporária;
- vínculo com falta e situação diária;
- política de retenção e acesso mínimo;
- auditoria sem registrar conteúdo médico desnecessário.

**Aceite:** arquivo fica no R2, somente metadata fica no PostgreSQL e apenas
usuários autorizados conseguem acessá-lo.

## Sprint 14 — Motor de cálculo diário

**Objetivo:** calcular jornada efetiva de forma determinística.

**Entregáveis:**

- `attendance.service` para minutos previstos, trabalhados, atraso, saída
  antecipada, extras e saldo;
- regras para intervalos, tolerância, escalas e tratamentos;
- resultado explicável, com origem de cada valor;
- reprocessamento seguro quando escala ou tratamento muda;
- bateria de testes unitários, incluindo virada de dia e casos incompletos.

**Aceite:** os mesmos dados sempre geram o mesmo resultado e nenhum cálculo usa
float ou regra escondida na interface.

## Sprint 15 — Banco de horas

**Objetivo:** manter saldos diários e acumulados auditáveis.

**Entregáveis:**

- `timeBankEntries` em minutos;
- créditos, débitos, ajustes manuais autorizados e referência à apuração;
- saldo por dia, período e acumulado;
- regras configuráveis sem reescrever o histórico;
- tela de extrato e auditoria;
- testes de recálculo, compensação e concorrência.

**Aceite:** cada alteração de saldo possui origem e o acumulado é reproduzível a
partir do extrato.

## Sprint 16 — Fechamento de competência

**Objetivo:** estabilizar resultados mensais antes dos relatórios oficiais.

**Entregáveis:**

- período de apuração e workflow aberto → em revisão → fechado;
- painel de pendências que bloqueiam fechamento;
- congelamento lógico dos resultados fechados;
- reabertura somente por usuário autorizado, com motivo e auditoria;
- resumo de atrasos, faltas, adicionais e banco de horas;
- testes de autorização e consistência.

**Aceite:** uma competência só fecha sem pendências críticas e qualquer reabertura
fica integralmente auditada.

## Sprint 17 — Portal do funcionário e gerente

**Objetivo:** liberar autoatendimento com isolamento rigoroso de dados.

**Entregáveis:**

- permissões efetivas de `MANAGER` e `EMPLOYEE`;
- funcionário consulta somente seus registros, escala, folgas e saldo;
- solicitação de correção, envio de atestado e troca de folga;
- gerente consulta escopo autorizado e trata apenas ações permitidas;
- notificações internas essenciais para solicitações e decisões;
- testes contra acesso horizontal e escalada de privilégios.

**Aceite:** funcionário não acessa dados de outro funcionário nem manipulando URL
ou payload; gerente não recebe poderes de admin implicitamente.

## Sprint 18 — Relatórios operacionais e exportações

**Objetivo:** entregar informação gerencial antes dos documentos legais.

**Entregáveis:**

- relatórios por funcionário, período, status, faltas, atrasos e banco de horas;
- espelho gerencial de ponto, ainda identificado como não oficial se necessário;
- exportação PDF/CSV com filtros reproduzíveis;
- geração assíncrona ou streaming apenas se a medição justificar;
- controle de acesso e auditoria de exportações sensíveis;
- testes de totalização e timezone.

**Aceite:** resultados da tela e do arquivo exportado coincidem para o mesmo
período e filtros.

## Sprint 19 — Hardening e produção inicial sem REP-C

**Objetivo:** colocar os módulos administrativos em operação real com dados
manuais/simulados controlados.

**Entregáveis:**

- Railway, PostgreSQL, domínio, TLS e ambientes de homologação/produção;
- CI com lint, TypeScript, testes, build e revisão de migrations;
- backup, restauração ensaiada, observabilidade e logs estruturados;
- rate limiting e proteções aplicáveis aos endpoints sensíveis;
- checklist de segurança, acessibilidade, performance e LGPD;
- treinamento inicial e plano de suporte/incidentes.

**Aceite:** deploy reproduzível, backup restaurável e operação administrativa
principal validada por usuários da churrascaria. Este é o MVP operacional.

## Sprint 20 — Fundação da integração REP-C

**Objetivo:** preparar integração independente de fabricante.

**Dependência externa:** fabricante/modelo escolhido e documentação oficial/SDK.

**Entregáveis:**

- levantamento técnico do equipamento e formato AFD vigente;
- contrato `REPAdapter` e implementação mock;
- `repDevices` e `repSyncLogs`;
- credenciais por dispositivo armazenadas com proteção adequada;
- `POST /api/rep/sync` autenticado, validado e com rate limiting;
- idempotência por `repDeviceId + nsr` e testes de reenvio/concorrência.

**Aceite:** o adapter mock envia lotes repetidos sem duplicar marcações e sem usar
login de usuário comum.

## Sprint 21 — Ponto Sync e adapter do fabricante

**Objetivo:** transportar marcações da rede local para a nuvem.

**Entregáveis:**

- agente local Ponto Sync com configuração e execução como serviço;
- adapter do fabricante escolhido;
- consulta incremental após último NSR confirmado;
- fila local durável, retry com backoff e recuperação após queda;
- telemetria sem dados sensíveis e diagnóstico operacional;
- instalador e procedimento de atualização/rollback.

**Aceite:** queda de internet, reinício e reenvio não perdem nem duplicam
marcações; sincronização retoma automaticamente.

## Sprint 22 — Piloto REP-C em campo

**Objetivo:** validar ponta a ponta no ambiente real da churrascaria.

**Entregáveis:**

- instalação em rede local e cadastro seguro do dispositivo;
- piloto controlado em paralelo ao processo vigente;
- conciliação entre AFD, NSR, API, banco e dashboard;
- alertas de sincronização parada, lacuna de NSR e falha de dispositivo;
- runbook de operação, suporte e recuperação;
- correções encontradas no piloto e aceite dos responsáveis.

**Aceite:** período acordado de piloto fecha sem perda, alteração ou duplicação de
marcações e com conciliação documentada.

## Sprint 23 — Conformidade e documentos oficiais

**Objetivo:** implementar saídas legais somente após validação da norma vigente.

**Dependência externa:** revisão da Portaria 671 e anexos vigentes por especialista
trabalhista/contábil e acesso às especificações oficiais atuais.

**Entregáveis:**

- matriz de requisitos legais e evidências de atendimento;
- Espelho de Ponto Eletrônico conforme layout vigente;
- AEJ e demais saídas estritamente conforme especificação validada;
- assinatura eletrônica somente se exigida e com solução aprovada;
- testes por arquivo-exemplo, casos-limite e validação externa;
- documentação de REP-C versus PTRP e preservação dos originais.

**Aceite:** arquivos passam nos validadores aplicáveis e recebem aceite formal do
especialista responsável. Nada é considerado oficial antes desse aceite.

## Sprint 24 — Lançamento final e estabilização

**Objetivo:** concluir a implantação de produção e transferir a operação.

**Entregáveis:**

- migração/importação de dados necessária, com reconciliação e rollback;
- testes ponta a ponta e de carga no volume esperado;
- revisão final de segurança, permissões, auditoria e recuperação de desastre;
- documentação de administração, usuário, suporte e arquitetura;
- treinamento de admins, gerentes e funcionários;
- monitoramento intensivo de lançamento e correção de defeitos críticos;
- backlog pós-lançamento priorizado.

**Aceite:** operação real funciona de REP-C a relatórios/documentos, responsáveis
estão treinados, métricas estão saudáveis e não há defeito crítico aberto.

## Riscos e pontos de decisão

- **Capacidade:** 24 sprints é estimativa-base; uma única pessoa acumulando produto,
  design, backend, frontend, infraestrutura e QA pode precisar de mais tempo.
- **Regra trabalhista:** tolerâncias, banco de horas, fechamento e documentos
  oficiais precisam de decisões formais da empresa e validação especializada.
- **REP-C:** fabricante, SDK/API, formato de comunicação e disponibilidade do
  computador local podem alterar as sprints 20–22.
- **Dados pessoais:** definir política LGPD, retenção, responsáveis e resposta a
  incidentes antes da produção inicial.
- **Object Storage:** acesso ao R2 é necessário antes da sprint 13.
- **Escopo:** pedidos novos entram no backlog e são priorizados; não devem romper a
  imutabilidade de marcações, auditoria ou segurança.

## Cerimônia sugerida por sprint

- Planejamento com objetivo único e critérios de aceite fechados.
- Refinamento da sprint seguinte durante a sprint atual.
- Demonstração em homologação com o responsável da churrascaria.
- Retrospectiva curta e registro de decisões arquiteturais relevantes.
- Release note com migrations, variáveis de ambiente e instruções de implantação.
