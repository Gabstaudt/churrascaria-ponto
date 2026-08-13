# Sprint 7 — Folgas, trocas, férias e afastamentos

**Estado:** concluída em 13 de agosto de 2026.

**Tipo do PR:** feature

**Migration:** `0006_special_darkstar.sql`

## Título sugerido do pull request

`feat: implementa gestão de folgas, trocas, férias e afastamentos`

## Resumo

Esta sprint adiciona o gerenciamento de indisponibilidades dos funcionários sem
apagar ou sobrescrever o histórico. Administradores podem registrar folgas,
solicitar e analisar trocas, cadastrar férias e informar afastamentos.

Os registros passam a participar automaticamente da resolução diária da escala.
O perfil detalhado do funcionário também foi transformado em uma central para
consultar dados cadastrais, jornadas, escalas, ausências, documentos e o futuro
espelho de ponto.

## Entregas funcionais

### Folgas

- cadastro de folga pontual por funcionário e data;
- motivo obrigatório;
- identificação automática do administrador autorizador;
- atualização da folga existente quando o funcionário e a data coincidem;
- restrição para impedir duas folgas do mesmo funcionário na mesma data;
- prevenção de conflito com férias, afastamentos e trocas aprovadas.

### Trocas de folga

- solicitação com data da folga e data compensada de trabalho;
- validação para impedir datas iguais;
- estados `PENDING`, `APPROVED` e `REJECTED`;
- aprovação ou rejeição administrativa;
- justificativa obrigatória na decisão;
- registro do solicitante, responsável pela análise e data da análise;
- prevenção de aprovação quando existe conflito de disponibilidade;
- aplicação no calendário somente depois da aprovação.

### Férias

- cadastro do período inicial e final;
- motivo ou observação obrigatória;
- identificação do administrador autorizador;
- validação da ordem das datas;
- prevenção de sobreposição com férias, afastamentos, folgas e trocas
  aprovadas.

### Afastamentos

- cadastro do período inicial e final;
- tipos médico, pessoal, legal e outro;
- motivo obrigatório;
- identificação do administrador autorizador;
- validação da ordem das datas;
- prevenção de conflito com outros períodos de indisponibilidade.

## Integração com o calendário de escalas

O calendário agora distingue:

- trabalho;
- folga;
- férias;
- afastamento;
- ausência de jornada vigente.

Também foram adicionados filtros para essas situações.

### Ordem de resolução diária

Para cada funcionário e data, o sistema utiliza a seguinte prioridade:

1. férias ou afastamento;
2. folga pontual autorizada;
3. troca de folga aprovada;
4. ajuste excepcional da Sprint 6;
5. jornada semanal vigente;
6. ausência de jornada.

Na troca aprovada, a data original passa a ser folga e a data compensada passa a
ser trabalho. Quando possível, o horário da jornada correspondente à data
original é utilizado na compensação.

## Central do funcionário

Ao selecionar um funcionário na listagem, seu perfil passou a oferecer as abas:

### Visão geral

- dados pessoais;
- dados profissionais;
- contato de emergência;
- indicadores de jornadas, ausências e documentos.

### Jornadas e escalas

- histórico real de jornadas e vigências;
- acesso ao detalhamento de cada jornada;
- atalho para criar uma jornada com o funcionário preenchido;
- atalho para abrir o calendário filtrado pelo funcionário.

### Folgas e ausências

- folgas pontuais;
- trocas com situação da solicitação;
- períodos de férias;
- períodos e tipos de afastamento;
- atalho para cadastrar um registro já vinculado ao funcionário.

### Documentos

- consulta dos metadados dos documentos vinculados, quando existirem;
- estado vazio quando não existem documentos;
- indicação transparente de que envio e visualização dependem do módulo de
  armazenamento seguro ainda não implementado.

### Espelho de ponto

- espaço reservado dentro da jornada do funcionário;
- indicação de indisponibilidade até a implementação das marcações e cálculos;
- nenhum dado fictício é apresentado.

## Interface e responsividade

- uso do mesmo `page-heading`, `data-panel`, `form-section` e limites de largura
  do painel administrativo;
- nenhum novo layout global foi criado;
- estilos de disponibilidade e perfil isolados por seletores próprios;
- perfil com cabeçalho compacto e ações que se reorganizam em telas menores;
- abas distribuídas no desktop e com rolagem horizontal no celular;
- conteúdo empilhado em uma coluna em dispositivos móveis;
- cartões com altura natural, sem alongamento ou distorção;
- resumo operacional apresentado como indicadores compactos;
- menu móvel principal preservado com quatro itens.

## Banco de dados

### `days_off`

- funcionário;
- data;
- motivo;
- administrador autorizador;
- timestamps;
- unicidade por funcionário e data.

### `day_off_swaps`

- funcionário;
- data da folga;
- data compensada de trabalho;
- motivo;
- situação;
- solicitante;
- responsável e data da análise;
- justificativa da decisão.

### `vacations`

- funcionário;
- início e fim;
- motivo;
- administrador autorizador;
- timestamps.

### `leave_periods`

- funcionário;
- tipo de afastamento;
- início e fim;
- motivo;
- administrador autorizador;
- timestamps.

### Enums

- `day_off_swap_status`: `PENDING`, `APPROVED`, `REJECTED`;
- `leave_type`: `MEDICAL`, `PERSONAL`, `LEGAL`, `OTHER`.

## Auditoria

As seguintes ações são persistidas em `audit_logs`:

- `CREATE_DAY_OFF`;
- `UPDATE_DAY_OFF`;
- `REQUEST_DAY_OFF_SWAP`;
- `APPROVE_DAY_OFF_SWAP`;
- `REJECT_DAY_OFF_SWAP`;
- `CREATE_VACATION`;
- `CREATE_LEAVE_PERIOD`.

Os registros incluem responsável, motivo e estados anterior e posterior quando
aplicável.

## Rotas entregues e atualizadas

| Rota | Finalidade |
| --- | --- |
| `/admin/disponibilidade` | Consultar folgas, trocas, férias e afastamentos |
| `/admin/disponibilidade/nova` | Cadastrar um registro de disponibilidade |
| `/admin/escalas` | Visualizar o reflexo das indisponibilidades na escala |
| `/admin/funcionarios/[id]` | Central de informações do funcionário |

## Principais arquivos

- `src/db/schema/availability.ts`;
- `src/db/schema/enums.ts`;
- `src/db/migrations/0006_special_darkstar.sql`;
- `src/validations/availability.ts`;
- `src/services/availability.service.ts`;
- `src/services/schedule-resolution.ts`;
- `src/services/schedule-calendar.service.ts`;
- `src/actions/availability.ts`;
- `src/components/availability/availability-form.tsx`;
- `app/admin/disponibilidade/page.tsx`;
- `app/admin/disponibilidade/nova/page.tsx`;
- `app/admin/escalas/page.tsx`;
- `app/admin/funcionarios/[id]/page.tsx`;
- `app/globals.css`.

## Como testar manualmente

1. Acesse **Escalas** e clique em **Folgas e ausências**.
2. Cadastre uma folga para um funcionário.
3. Confirme o reflexo da folga no calendário.
4. Cadastre férias e um afastamento em períodos válidos.
5. Tente cadastrar um período sobreposto e confirme a mensagem de conflito.
6. Solicite uma troca de folga.
7. Informe a justificativa e aprove a troca.
8. Confirme no calendário a folga original e o trabalho compensado.
9. Solicite outra troca e teste a rejeição.
10. Acesse **Funcionários** e selecione o funcionário utilizado.
11. Navegue pelas abas do perfil e confirme jornadas e ausências.
12. Use os atalhos para abrir o calendário individual e criar novos registros.
13. Repita o fluxo no celular e confirme que não existe rolagem horizontal da
    página ou conteúdo cortado.

## Validação técnica realizada

- migration aplicada ao PostgreSQL local;
- 10 arquivos de teste aprovados;
- 46 testes aprovados;
- resolução de férias, afastamento, folga e troca testada;
- validações de períodos, tipos e decisões testadas;
- TypeScript aprovado;
- ESLint aprovado;
- build de produção aprovado;
- `git diff --check` aprovado;
- rotas administrativas reconhecidas pelo build do Next.js.

## Checklist do pull request

- [x] Modelo de folgas criado.
- [x] Modelo de trocas e estados criado.
- [x] Modelo de férias criado.
- [x] Modelo de afastamentos criado.
- [x] Migration gerada e aplicada.
- [x] Validações e conflitos implementados.
- [x] Fluxo de solicitação e decisão de troca implementado.
- [x] Auditoria implementada.
- [x] Integração com o calendário implementada.
- [x] Central do funcionário implementada.
- [x] Layout administrativo preservado.
- [x] Responsividade revisada.
- [x] Testes, TypeScript, lint e build aprovados.

## Limitações conhecidas e próximas entregas

- o upload e a abertura de documentos serão implementados com armazenamento
  seguro em sprint específica;
- o espelho de ponto depende das marcações originais e cálculos das próximas
  sprints;
- cancelamento com preservação histórica e telas individuais de edição para
  férias e afastamentos ainda devem ser adicionados antes de considerar o fluxo
  administrativo completo de manutenção desses registros.

## Próximo passo

Sprint 8: marcações de ponto originais simuladas e imutáveis.
