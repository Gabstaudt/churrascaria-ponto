# Sprint 17 — Portal do Funcionário e do Gerente

## Objetivo

Entregar autoatendimento com isolamento de dados por usuário e escopo explícito
para gestores, sem conceder permissões administrativas implicitamente.

## Entregas

- vínculo único entre usuário `EMPLOYEE` e cadastro de funcionário;
- escopo explícito entre usuário `MANAGER` e funcionários autorizados;
- redirecionamento após login conforme o papel do usuário;
- portal responsivo do funcionário em `/portal`;
- consulta exclusiva aos próprios registros, jornadas, folgas e banco de horas;
- solicitação de correção de ponto sem alteração direta da marcação original;
- solicitação de troca de folga;
- envio de atestado para análise, com armazenamento privado;
- portal responsivo do gestor em `/gestao`;
- análise de correções, trocas e atestados limitada à equipe atribuída;
- notificações internas para novos pedidos e decisões;
- tela administrativa `/admin/acessos` para criar logins e atribuir escopos;
- aprovação ou rejeição de atestados também pelo administrador;
- download de atestado autorizado pelo papel e pelo vínculo do funcionário;
- auditoria da criação de acessos e das decisões sobre atestados;
- migration `0013_black_ravenous.sql`.

## Regras de segurança

- o identificador do funcionário nunca é aceito do formulário do empregado; ele
  é obtido da sessão no servidor;
- funcionário acessa somente o cadastro vinculado ao próprio usuário;
- gestor acessa somente funcionários presentes em `manager_employees`;
- gestor não pode acessar `/admin` nem executar ações administrativas;
- aprovação por gestor repete a verificação de escopo no serviço, além da
  proteção da rota;
- links privados de atestado validam novamente usuário, papel e vínculo antes de
  gerar a URL temporária;
- correções aprovadas geram ajustes auditáveis e preservam a marcação original;
- períodos fechados continuam protegidos pelas travas da Sprint 16.

## Fluxo operacional

1. O administrador cria o login em **Acessos**.
2. Para funcionário, vincula a conta ao cadastro correspondente.
3. Para gestor, atribui individualmente os funcionários sob responsabilidade.
4. O usuário entra pela tela normal de login e é direcionado ao portal correto.
5. Solicitações criam notificações para administradores e gestores autorizados.
6. Uma decisão cria notificação de retorno para o funcionário.

## Validação

- `npm run db:generate`;
- `npm run typecheck`;
- `npm run lint`;
- `npm test` — 23 arquivos e 98 testes aprovados;
- `npx next build --webpack` — build de produção aprovado;
- testes específicos de isolamento horizontal, escopo do gestor e ausência de
  escalada implícita para administrador.

O build padrão com Turbopack foi adicionalmente tentado, mas o ambiente de
execução bloqueou a porta interna usada pelo processador de CSS. O mesmo projeto
foi compilado integralmente pelo builder webpack oficial do Next.js.
