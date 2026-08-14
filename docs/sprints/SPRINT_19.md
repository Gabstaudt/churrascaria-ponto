# Sprint 19 — Hardening e Produção Inicial sem REP-C

## Entregas versionadas

- Docker multi-stage com saída standalone e usuário sem privilégios;
- `railway.toml` com migration pré-deploy, health check e política de restart;
- configuração local de produção em `compose.production.yaml`;
- CI com PostgreSQL 17, migration, revisão de schema, TypeScript, lint, testes e build;
- validação de variáveis obrigatórias na inicialização do servidor;
- headers de segurança e cookies seguros em produção;
- health checks de vida e prontidão;
- logs JSON estruturados;
- rate limit distribuído no PostgreSQL para exportações e atestados;
- migration `0014_fair_tombstone.sql`;
- tela global de recuperação de erro;
- scripts de backup com checksum e restauração com confirmação explícita;
- runbooks de deploy, backup/restauração e incidentes;
- checklist de segurança, acessibilidade, performance, LGPD e homologação;
- roteiro de treinamento para administrador, gestor e funcionário.

## Validação técnica

- 26 arquivos e 104 testes aprovados;
- TypeScript, ESLint e `git diff --check` aprovados;
- schema regenerado sem divergências após a migration;
- build Next.js e build Docker standalone aprovados;
- container de produção executado localmente com liveness, readiness, PostgreSQL
  e log estruturado validados;
- auditoria npm sem vulnerabilidades altas ou críticas. Permanecem quatro alertas
  moderados em `esbuild` transitivo do `drizzle-kit`, ferramenta de desenvolvimento
  ausente da imagem final; a correção automática sugerida exige downgrade
  incompatível e não foi aplicada.

## Dependências externas

O código deixa o deploy reproduzível, mas as seguintes ações dependem de contas,
credenciais e aprovação do proprietário e não são executadas automaticamente:

- criação dos projetos Railway de homologação e produção;
- provisionamento dos bancos e buckets R2;
- configuração e validação do domínio/TLS;
- ativação de backups gerenciados e versionamento do bucket;
- ensaio de restauração com infraestrutura isolada;
- homologação e aceite por usuários da churrascaria.

O MVP só deve ser declarado operacional depois que todos os itens externos do
checklist estiverem concluídos e assinados.
