# Sprint 12 — Auditoria Administrativa Completa

## Objetivo

Consolidar uma trilha administrativa consultável, transacional e protegida contra
exposição de dados sensíveis para todas as operações de negócio já existentes.

## Entregas realizadas

- serviço transversal `recordAudit`, usado dentro das mesmas transações das
  alterações de funcionário, jornada, escala, folga, ausência e ponto;
- padronização dos registros que antes eram gravados diretamente por cada
  serviço de domínio;
- política recursiva de proteção dos snapshots, com ocultação de senhas,
  tokens, segredos, cookies, sessões, hashes e credenciais;
- mascaramento de CPF, preservando somente os dois últimos dígitos;
- proteção dupla: dados novos são saneados antes de persistir e dados antigos
  são saneados novamente antes de serem exibidos;
- página `/admin/auditoria` com filtros por responsável, entidade, ação e
  período, totalização e paginação;
- detalhamento somente leitura de cada evento, com responsável, data, motivo e
  comparação entre estado anterior e posterior;
- autorização explícita de administrador nas páginas de listagem e detalhe;
- acesso pela lateral administrativa no desktop, sem alterar a navegação móvel
  principal já consolidada;
- layout responsivo próprio para consulta em computador, tablet e celular;
- testes unitários de autorização e de não vazamento de informações sensíveis.

## Critérios de aceite atendidos

- alterações de funcionário, jornada, escala, folga, ausência e ponto possuem
  trilha persistente;
- a gravação da trilha participa da transação da operação de negócio;
- somente administradores autenticados acessam a consulta;
- CPF e credenciais não são apresentados nos snapshots;
- filtros e detalhe permitem investigar autoria, momento, entidade e mudanças.

## Validação

- `npm run typecheck`;
- `npm test`;
- `npm run lint`;
- `npm run build`.
