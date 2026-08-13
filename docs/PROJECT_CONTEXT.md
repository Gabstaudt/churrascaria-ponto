# Contexto mestre — Sistema de Ponto Eletrônico

Este documento é a referência persistente do projeto **Sistema de Ponto
Eletrônico — Churrascaria Marituba**. Foi consolidado a partir do documento
“Contexto Mestre do Projeto.docx”, fornecido em 7 de agosto de 2026.

Antes de implementar mudanças, considerar integralmente estas decisões. Mudanças
arquiteturais relevantes exigem necessidade técnica clara e explicação prévia.

## Objetivo

Construir um sistema web de produção para gestão de funcionários, jornadas,
escalas, folgas, marcações, tratamentos, faltas, justificativas, atestados,
férias, afastamentos, horas extras, banco de horas, espelho de ponto, relatórios
e auditoria. Futuramente, integrar um relógio REP-C biométrico homologado.

O REP-C continuará sendo a fonte das marcações originais. O sistema fará gestão,
tratamento, auditoria e relatórios e poderá, no futuro, exercer a função de PTRP.

## Arquitetura obrigatória

- Monólito modular em um único projeto Next.js e um único repositório.
- Fluxo: UI → backend Next.js → service/regra de negócio → Drizzle → PostgreSQL.
- Client Components nunca acessam o banco diretamente.
- Operações sensíveis passam por Route Handlers ou, quando adequado, Server
  Actions, sempre com validação, autorização e regras no servidor.
- Não criar backend separado, microsserviços, segundo repositório ou Redis sem
  uma necessidade comprovada.
- Separar responsabilidades e evitar arquivos gigantes e abstrações prematuras.

## Stack e infraestrutura

- Next.js com App Router, React, TypeScript estrito e Tailwind CSS.
- shadcn/ui e Lucide Icons para interface.
- PostgreSQL, Drizzle ORM e Drizzle Kit.
- Zod para toda entrada externa.
- Better Auth é a preferência para autenticação; outra solução exige justificativa.
- GitHub para código e Railway para aplicação.
- Banco PostgreSQL via `DATABASE_URL`, sem acoplamento ao provedor; Railway ou
  Supabase podem ser usados durante o desenvolvimento.
- Cloudflare R2 futuramente para arquivos. O banco guarda apenas metadados e
  chaves; nunca binários.

## Segurança, autorização e tempo

- Dados empresariais, pessoais e trabalhistas são sensíveis.
- Nunca armazenar senha ou PIN em texto puro, expor segredos em `NEXT_PUBLIC_`,
  confiar em role/identidade enviada pelo navegador ou revelar SQL, stack traces
  e credenciais em erros.
- Autenticação, autorização, validação, horário oficial, regras e auditoria são
  responsabilidades do backend.
- Perfis iniciais: `ADMIN`, `MANAGER`/gerente e `EMPLOYEE`/funcionário. O gerente
  não herda automaticamente poderes administrativos. Funcionários só acessam os
  próprios dados.
- Timezone oficial: `America/Belem`. Exibição em `DD/MM/AAAA`, relógio de 24 horas.
- Marcações oficiais usam horário do servidor/banco, nunca o relógio do cliente.
- Datas usam tipos nativos do PostgreSQL; formatação ocorre apenas na interface.

## Regras centrais do domínio

### Funcionários

- Primeiro módulo funcional: listar, cadastrar, visualizar, editar, inativar e
  reativar.
- Evitar exclusão física quando houver histórico; usar status/soft delete.
- Status internos: `ACTIVE`, `VACATION`, `LEAVE`, `TERMINATED`, `INACTIVE`, com
  labels em português na interface.
- CPF normalizado somente com dígitos, validado e único; matrícula também única.

### Jornadas e escalas

- Suportar horários distintos por dia, intervalos, tolerância, vigência, mudanças
  históricas e exceções.
- Não sobrescrever histórico relevante.
- Escalas devem distinguir trabalho, folga, férias, afastamento, atestado e outros.

### Marcações e tratamentos

- `timeEntries` representa marcações originais e é imutável após importação.
  Operações administrativas normais não podem editar nem apagar o original.
- Correções ficam separadas em `timeAdjustments`, com funcionário, dia, tipo,
  horário ajustado quando aplicável, motivo, responsável e timestamp.
- Preservar histórico de inclusões, desconsiderações, atrasos, saídas antecipadas,
  faltas, atestados, folgas, férias, afastamentos, trocas e erros operacionais.
- Ausência de marcação diante de jornada prevista gera no máximo uma ocorrência
  ambígua (`POSSIBLE_ABSENCE`) até tratamento administrativo.

### Auditoria

- Ações administrativas relevantes geram `AuditLog` persistente, incluindo ação,
  entidade, ID, responsável, estado anterior/posterior, motivo e data.
- Logs técnicos estruturados não substituem auditoria de negócio.

### Horas

- Cálculos de jornada e banco de horas pertencem a services dedicados, nunca à UI.
- Representar durações em minutos quando apropriado para evitar ponto flutuante.
- Regras de cálculo, tratamento, autenticação e autorização recebem prioridade de
  testes unitários.

## Entidades e evolução incremental

Primeira etapa, somente:

- `users`: id, nome, email, hash de senha, role, ativo e timestamps.
- `employees`: id, nome completo, CPF, telefone, cargo, matrícula, admissão,
  status, foto, ativo e timestamps.

Entidades futuras, criadas apenas quando a fase correspondente exigir:
`workSchedules`, `scheduleDays`, `shifts`, `daysOff`, `dayOffSwaps`, `timeEntries`,
`timeAdjustments`, `absences`, `absenceJustifications`, `medicalCertificates`,
`vacations`, `leavePeriods`, `timeBankEntries`, `auditLogs`, `repDevices`,
`repSyncLogs` e `notifications`.

Toda alteração estrutural usa migrations Drizzle revisadas. Não apagar migrations
já aplicadas nem alterar produção manualmente como fluxo padrão. Seeds não contêm
senhas reais. Manter `.env.example` sem segredos e nunca versionar `.env`.

## Integração futura com REP-C

- Não implementar o Ponto Sync agora; apenas preservar espaço arquitetural.
- Fluxo futuro: REP-C na rede local → agente Ponto Sync → `POST /api/rep/sync` →
  backend → PostgreSQL.
- O agente consulta registros por NSR incremental, tolera quedas e reenvios.
- API usa credenciais próprias por dispositivo, nunca sessão de usuário comum.
- Garantir idempotência com unicidade de `repDeviceId + nsr`.
- Isolar fabricantes atrás de `REPAdapter`, com implementações futuras como
  Control ID e Topdata.

Antes de implementar AFD, AEJ, espelho oficial, assinatura ou integração oficial,
consultar a versão vigente da Portaria MTP nº 671/2021 e seus anexos. Não inventar
layouts ou requisitos legais.

## Experiência e qualidade

- Interface em português do Brasil, moderna, profissional, responsiva,
  mobile-first, rápida e simples.
- Evitar aparência genérica, excesso de gradients, cards, sombras e componentes
  grandes. Preferir tipografia clara, espaçamento consistente, tabelas, badges,
  dialogs e drawers discretos.
- Componentizar quando houver reuso real: badges de status, tabelas, cabeçalhos,
  formulários, confirmação e estados vazios/de carregamento/de erro.
- TypeScript estrito, sem `any` injustificado. Derivar tipos de Drizzle e Zod em
  vez de duplicá-los manualmente.
- Erros do backend devem ser consistentes e seguros; a interface exibe mensagens
  úteis em português.
- Trabalhar incrementalmente, preservar código funcional e executar lint,
  typecheck e build quando aplicável.

## Ordem de desenvolvimento

1. Fundação: Drizzle/PostgreSQL/migrations, `users`, `employees`, autenticação,
   login, proteção de `/admin` e layout administrativo.
2. Funcionários: CRUD, status, inativação, validações e auditoria inicial.
3. Jornadas: dias, horários, vigência e tolerâncias.
4. Escalas: calendário, folgas e exceções.
5. Ponto: registros inicialmente simulados, situação diária e incompletudes.
6. Tratamentos: ajustes, faltas, justificativas e auditoria.
7. Atestados: upload, storage, períodos e permissões.
8. Cálculos: atraso, horas trabalhadas/adicionais e banco de horas.
9. Relatórios: espelho, fechamento e exportações.
10. REP-C: adapter, Ponto Sync, API, NSR e AFD.
11. Conformidade final: AEJ, documentos oficiais e revisão legal vigente.

O primeiro marco termina em: login → dashboard administrativo → funcionários →
cadastrar → editar → visualizar → inativar, usando PostgreSQL real. Não avançar
para recursos sofisticados antes de estabilizar essa fundação.

## Prioridade para decisões

1. Integridade dos registros.
2. Segurança.
3. Conformidade.
4. Consistência dos dados.
5. Simplicidade arquitetural.
6. Manutenção.
7. Experiência do usuário.
8. Performance.
9. Estética.

## Estado observado em 7 de agosto de 2026

- Projeto Next.js 16.3.0 com React 19.2.8, TypeScript e Tailwind CSS 4.
- Estrutura ainda é essencialmente a do `create-next-app`; não há módulos de
  domínio, autenticação, rotas administrativas, schemas ou migrations.
- `drizzle-orm`, `drizzle-kit` e `postgres` já aparecem em `package.json`, mas a
  configuração e a camada `src/db` ainda não existem.
- `README.md`, metadata, página inicial e estilos permanecem genéricos.
- `package.json` e `package-lock.json` já tinham alterações locais antes desta
  consolidação; elas devem ser preservadas.

## Estado de execução

As Sprints 1 a 4 foram implementadas e validadas com PostgreSQL local. O primeiro
marco funcional — autenticação e ciclo administrativo completo de funcionários —
está concluído e registrado nos relatórios em `docs/sprints/`.

O próximo trabalho planejado é a Sprint 5: jornadas com vigência histórica.
